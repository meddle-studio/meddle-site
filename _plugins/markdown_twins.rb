# Writes a Markdown twin of every public page for AI agents: /sprints/ →
# /sprints.md, / → /index.md, /projects/mfo/ → /projects/mfo.md. Each twin is
# converted from the page's rendered <main>, so it stays in sync with the HTML.
#
# Pages with `sitemap: false` or `markdown: false` (and the 404) get no twin.
# Mark a non-heading label as a heading in the twin with data-md="h2" (or h3…),
# and leave an element out of the twin with data-md="skip".
# The generator sets `page.markdown_url` so layouts and llms.txt can link it.
#
# Internal links point at other twins, except links to a page with a form
# (the contact page), which stay on the HTML page where the action lives.
# Case studies (documents with `client`) open with a facts block from their
# front matter and close with links to the other case studies.
require "nokogiri"
require "yaml"

module MeddleMarkdown
  DROP = "script, style, noscript, template, svg, video, audio, iframe, form, nav, " \
         "button, figure, img, picture, hr, [aria-hidden='true'], [hidden], [data-md='skip']"
  BLOCK = %w[address article aside blockquote dd div dl dt figcaption figure footer
             header h1 h2 h3 h4 h5 h6 li main ol p section table tbody td th thead tr ul].freeze
  BLOCK_CSS = BLOCK.join(", ")
  SPACE = /[\s ]+/
  NOT_CREDITED = ["Typefaces"].freeze # credit roles that aren't people

  def self.eligible?(doc)
    return false unless doc.output_ext == ".html"
    return false if doc.data["sitemap"] == false || doc.data["markdown"] == false
    return false if doc.respond_to?(:name) && doc.name == "404.html"
    doc.is_a?(Jekyll::Document) ? doc.write? : true
  end

  def self.url_for(url)
    path = url.sub(%r{/index\.html\z}, "/").sub(/\.html\z/, "")
    path == "/" ? "/index.md" : path.chomp("/") + ".md"
  end

  def self.twinned(site)
    (site.pages + site.documents).select { |doc| doc.data["markdown_url"] && doc.output }
  end

  # Absolute HTML URL → absolute twin URL, for every page without a form.
  def self.link_map(docs, site_url)
    docs.reject { |doc| doc.output.include?("<form") }
        .to_h { |doc| [site_url + doc.url, site_url + doc.data["markdown_url"]] }
  end

  def self.convert(doc, site_url, docs, links)
    html = Nokogiri::HTML5(doc.output)
    root = html.at_css("main") || html.at_css("body")
    root.css(DROP).each(&:remove)

    meta = { "title" => doc.data["title"].to_s.strip,
             "description" => doc.data["description"].to_s.strip,
             "url" => site_url + doc.url }.reject { |_, v| v.empty? }

    parts = []
    parts.concat(case_study_head(doc)) if doc.data["client"]
    parts.concat(blocks(root, :base => site_url, :links => links))
    parts.concat(more_work(doc, docs, site_url)) if doc.data["client"]
    parts << "---"
    parts << "[All pages, FAQ, and contact details](#{site_url}/llms.txt)"
    meta.to_yaml + "---\n\n" + parts.join("\n\n") + "\n"
  end

  def self.case_study_head(doc)
    d = doc.data
    client = d["client_url"] ? "[#{d['client']}](#{d['client_url']})" : d["client"]
    people = Hash.new { |h, k| h[k] = [] }
    Array(d["credits"]).reject { |c| NOT_CREDITED.include?(c["role"]) }.each do |c|
      Array(c["entries"]).each { |name| people[strip_html(name)] << c["role"] }
    end
    facts = [
      ["Client", client],
      ["Industry", d["industry"]],
      ["Published", d["date"]&.strftime("%B %Y")],
      ["Services", Array(d["services"]).join(", ")],
      ["Credits", people.map { |name, roles| "#{name} (#{roles.join(', ')})" }.join(", ")],
      ["Result", d["result_summary"]],
    ].reject { |_, v| v.to_s.strip.empty? }

    ["# #{squish(strip_html(d['tagline'] || d['title']))}",
     facts.map { |k, v| "**#{k}:** #{v}" }.join("  \n"),
     "---"]
  end

  def self.more_work(doc, docs, site_url)
    others = docs.select { |o| o.data["client"] && o != doc }.sort_by { |o| o.data["order"].to_i }
    return [] if others.empty?
    ["## More work",
     others.map { |o| "- [#{o.data['client']}](#{site_url}#{o.data['markdown_url']})" }.join("\n")]
  end

  # Block context: flushes inline runs as paragraphs between block children.
  def self.blocks(node, ctx)
    out = []
    buf = +""
    flush = lambda do
      text = squish(buf)
      out << text unless text.empty?
      buf = +""
    end

    node.children.each do |child|
      if child.element? && child.name == "a" && child.at_css(BLOCK_CSS)
        flush.call
        out.concat(blocks(child, ctx.merge(:href => link(child["href"], ctx))))
      elsif child.element? && (BLOCK.include?(child.name) || child["data-md"])
        flush.call
        out.concat(block(child, ctx))
      else
        buf << inline(child, ctx)
      end
    end
    flush.call
    out
  end

  def self.block(el, ctx)
    case el["data-md"] || el.name
    when /\Ah([1-6])\z/
      text = squish(inline_children(el, ctx))
      return [] if text.empty?
      text = "[#{text}](#{ctx[:href]})" if ctx[:href]
      [ctx[:in_list] ? "**#{text}**" : "#" * $1.to_i + " " + text]
    when "ul", "ol"
      list_items(el, ctx).each_with_index.map do |(li, item_ctx), i|
        marker = el.name == "ol" ? "#{i + 1}." : "-"
        parts = blocks(li, item_ctx.merge(:in_list => true))
        parts.shift if el.name == "ol" && parts.first.to_s.match?(/\A\d+\z/) # visible "01"
        text = parts.join(" — ")
        text.empty? ? nil : "#{marker} #{text}"
      end.compact.then { |items| items.empty? ? [] : [items.join("\n")] }
    when "blockquote"
      [blocks(el, ctx).map { |b| b.gsub(/^/, "> ") }.join("\n>\n")]
    else
      blocks(el, ctx)
    end
  end

  # List items, including ones wrapped in a block link (<a><li>…</li></a>).
  def self.list_items(list, ctx)
    list.children.select(&:element?).flat_map do |child|
      if child.name == "li"
        [[child, ctx]]
      elsif child.name == "a"
        href = link(child["href"], ctx)
        child.css("li").map { |li| [li, ctx.merge(:href => href)] }
      else
        list_items(child, ctx)
      end
    end
  end

  def self.inline(node, ctx)
    return node.text if node.text?
    return "" unless node.element?

    inner = inline_children(node, ctx)
    case node.name
    when "em", "i" then wrap(inner, "*")
    when "strong", "b" then wrap(inner, "**")
    when "code" then wrap(inner, "`")
    when "br" then " "
    when "a"
      href = link(node["href"], ctx)
      text = squish(inner)
      href && !text.empty? && !ctx[:href] ? "[#{text}](#{href})" : inner
    else
      BLOCK.include?(node.name) ? " #{inner} " : inner
    end
  end

  def self.inline_children(node, ctx)
    node.children.map { |c| inline(c, ctx) }.join
  end

  # Keeps edge spaces outside the markers so "*And* Good" doesn't become "*And *Good".
  def self.wrap(text, mark)
    core = squish(text)
    return text if core.empty?
    lead = text[/\A[\s ]*/].empty? ? "" : " "
    trail = text[/[\s ]*\z/].empty? ? "" : " "
    "#{lead}#{mark}#{core}#{mark}#{trail}"
  end

  # Absolute URL for href, swapped for its twin when the target has one
  # (the #fragment is dropped, since twins have no anchors).
  def self.link(href, ctx)
    return nil if href.nil? || href.empty? || href.start_with?("#", "javascript:")
    url = href.start_with?("/") ? ctx[:base] + href : href
    page, _fragment = url.split("#", 2)
    ctx[:links].fetch(page, url)
  end

  def self.strip_html(text)
    Nokogiri::HTML5.fragment(text.to_s).text
  end

  def self.squish(text)
    text.gsub(SPACE, " ").strip
  end
end

module Jekyll
  class MarkdownTwins < Generator
    priority :lowest

    def generate(site)
      (site.pages + site.documents).each do |doc|
        next unless MeddleMarkdown.eligible?(doc)
        doc.data["markdown_url"] = MeddleMarkdown.url_for(doc.url)
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  site_url = site.config["url"].to_s.chomp("/")
  docs = MeddleMarkdown.twinned(site)
  links = MeddleMarkdown.link_map(docs, site_url)
  docs.each do |doc|
    path = File.join(site.dest, doc.data["markdown_url"])
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, MeddleMarkdown.convert(doc, site_url, docs, links))
  end
end
