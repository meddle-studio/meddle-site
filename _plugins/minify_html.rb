# Minifies built HTML, leaving the DOCTYPE + ASCII art comment at the top of
# the page untouched. Skipped under `jekyll serve` so local output stays readable.
#
# Inline JS goes through esbuild (minify_html's bundled JS minifier silently
# skips valid code like `new Date().getTime()`); if esbuild isn't installed the
# script is left as-is. JSON-LD is compacted with Ruby's JSON.
require "json"
require "open3"
require "minify_html"

module MeddleMinify
  ART_COMMENT = /\A\s*<!DOCTYPE html><!--.*?-->\n/m
  SCRIPT = %r{(<script\b[^>]*>)(.*?)(</script>)}m
  JS_TYPE = %r{\A(text/javascript|application/javascript|module)\z}i

  OPTIONS = {
    :keep_html_and_head_opening_tags => true,
    :keep_closing_tags => true,
    :ensure_spec_compliant_unquoted_attribute_values => true,
    :minify_css => true,
  }.freeze

  def self.minify(html, esbuild)
    art = html[ART_COMMENT].to_s
    rest = minify_scripts(html[art.length..-1], esbuild)
    art + minify_html(rest, OPTIONS)
  end

  def self.minify_scripts(html, esbuild)
    html.gsub(SCRIPT) do
      tag, body, close = $1, $2, $3
      type = tag[/\btype=["']?([^"'\s>]+)/i, 1]
      body = if body.strip.empty?
               body
             elsif type&.casecmp?("application/ld+json")
               compact_json(body)
             elsif type.nil? || type.match?(JS_TYPE)
               minify_js(body, esbuild)
             else
               body
             end
      tag + body + close
    end
  end

  def self.compact_json(body)
    JSON.generate(JSON.parse(body))
  rescue JSON::ParserError => e
    Jekyll.logger.warn "Minify:", "JSON-LD left as-is (#{e.message.lines.first.strip})"
    body
  end

  def self.minify_js(body, esbuild)
    return body unless esbuild
    out, err, status = Open3.capture3(esbuild, "--minify", "--loader=js", :stdin_data => body)
    return out.chomp if status.success?
    Jekyll.logger.warn "Minify:", "inline script left as-is (#{err.lines.first.to_s.strip})"
    body
  end
end

Jekyll::Hooks.register :site, :post_render do |site|
  next if site.config["serving"]

  esbuild = File.join(site.source, "node_modules", ".bin", "esbuild")
  unless File.executable?(esbuild)
    Jekyll.logger.warn "Minify:", "esbuild not found, inline scripts won't be minified"
    esbuild = nil
  end

  (site.pages + site.documents).each do |doc|
    next unless doc.output_ext == ".html" && doc.output
    doc.output = MeddleMinify.minify(doc.output, esbuild)
  end
end
