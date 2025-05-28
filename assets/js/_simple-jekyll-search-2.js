!(function () {
    "use strict";
    var SearchEngine = {
        compileTemplate: function (data) {
            return TemplateEngine.template.replace(TemplateEngine.pattern, function (match, key) {
                var replacement = TemplateEngine.middleware(key, data[key], TemplateEngine.template);
                return replacement !== undefined ? replacement : data[key] || match;
            });
        },
        setOptions: function (options) {
            (TemplateEngine.pattern = options.pattern || TemplateEngine.pattern),
            (TemplateEngine.template = options.template || TemplateEngine.template),
            "function" == typeof options.middleware && (TemplateEngine.middleware = options.middleware);
        },
    };
    const TemplateEngine = { pattern: /\{(.*?)\}/g, template: "", middleware: function () {} };
    var TextMatcher = function (text, query) {
            var textLength = text.length,
                queryLength = query.length;
            if (queryLength < textLength) return !1;
            if (textLength === queryLength) return text === query;
            t: for (var i = 0, j = 0; i < textLength; i++) {
                for (var charCode = text.charCodeAt(i); j < queryLength; ) if (query.charCodeAt(j++) === charCode) continue t;
                return !1;
            }
            return !0;
        },
        CaseInsensitiveMatcher = new (function () {
            this.matches = function (text, query) {
                return TextMatcher(query.toLowerCase(), text.toLowerCase());
            };
        })(),
        WordMatcher = new (function () {
            this.matches = function (text, query) {
                return (
                    !!text &&
                    ((text = text.trim().toLowerCase()),
                    (query = query.trim().toLowerCase()).split(" ").filter(function (word) {
                        return 0 <= text.indexOf(word);
                    }).length === query.split(" ").length)
                );
            };
        })(),
        Storage = {
            put: function (data) {
                if (isObject(data)) return addData(data);
                if (
                    (function (data) {
                        return Boolean(data) && "[object Array]" === Object.prototype.toString.call(data);
                    })(data)
                )
                    return (function (dataArray) {
                        const result = [];
                        clearData();
                        for (let i = 0, len = dataArray.length; i < len; i++) isObject(dataArray[i]) && result.push(addData(dataArray[i]));
                        return result;
                    })(data);
                return undefined;
            },
            clear: clearData,
            search: function (query) {
                return query
                    ? (function (data, query, strategy, options) {
                          const result = [];
                          for (let i = 0; i < data.length && result.length < options.limit; i++) {
                              var match = (function (item, query, strategy, options) {
                                  for (const key in item)
                                      if (
                                          !(function (text, excludePatterns) {
                                              for (let i = 0, len = excludePatterns.length; i < len; i++) {
                                                  var pattern = excludePatterns[i];
                                                  if (new RegExp(pattern).test(text)) return !0;
                                              }
                                              return !1;
                                          })(item[key], options.exclude) &&
                                          strategy.matches(item[key], query)
                                      )
                                          return item;
                              })(data[i], query, strategy, options);
                              match && result.push(match);
                          }
                          return result;
                      })(dataSource, query, SearchConfig.searchStrategy, SearchConfig).sort(SearchConfig.sort)
                    : [];
            },
            setOptions: function (options) {
                (SearchConfig = options || {}),
                (SearchConfig.fuzzy = options.fuzzy || !1),
                (SearchConfig.limit = options.limit || 10),
                (SearchConfig.searchStrategy = options.fuzzy ? CaseInsensitiveMatcher : WordMatcher),
                (SearchConfig.sort = options.sort || defaultSort),
                (SearchConfig.exclude = options.exclude || []);
            },
        };
    function defaultSort() {
        return 0;
    }
    const dataSource = [];
    let SearchConfig = {};
    function clearData() {
        return (dataSource.length = 0), dataSource;
    }
    function isObject(data) {
        return Boolean(data) && "[object Object]" === Object.prototype.toString.call(data);
    }
    function addData(data) {
        return dataSource.push(data), dataSource;
    }
    (SearchConfig.fuzzy = !1),
    (SearchConfig.limit = 10),
    (SearchConfig.searchStrategy = SearchConfig.fuzzy ? CaseInsensitiveMatcher : WordMatcher),
    (SearchConfig.sort = defaultSort),
    (SearchConfig.exclude = []);
    var HTTPRequest = {
        load: function (url, callback) {
            const xhr = window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
            xhr.open("GET", url, !0), (xhr.onreadystatechange = responseHandler(xhr, callback)), xhr.send();
        },
    };
    function responseHandler(xhr, callback) {
        return function () {
            if (4 === xhr.readyState && 200 === xhr.status)
                try {
                    callback(null, JSON.parse(xhr.responseText));
                } catch (err) {
                    callback(err, null);
                }
        };
    }
    var OptionsValidator = function (options) {
            if (!options || !("undefined" != typeof options.required && options.required instanceof Array))
                throw new Error("-- OptionsValidator: required options missing");
            if (!(this instanceof OptionsValidator)) return new OptionsValidator(options);
            const requiredOptions = options.required;
            (this.getRequiredOptions = function () {
                return requiredOptions;
            }),
                (this.validate = function (data) {
                    const missingOptions = [];
                    return (
                        requiredOptions.forEach(function (option) {
                            "undefined" == typeof data[option] && missingOptions.push(option);
                        }),
                        missingOptions
                    );
                });
        },
        Utility = {
            mergeObjects: function (obj1, obj2) {
                const merged = {};
                for (const key in obj1) (merged[key] = obj1[key]), "undefined" != typeof obj2[key] && (merged[key] = obj2[key]);
                return merged;
            },
            isJSONObject: function (data) {
                try {
                    return data instanceof Object && JSON.parse(JSON.stringify(data)) ? !0 : !1;
                } catch (err) {
                    return !1;
                }
            },
        };
    !(function (window) {
        let SearchConfig = {
                searchInput: null,
                resultsContainer: null,
                json: [],
                successCallback: Function.prototype,
                searchResultTemplate: '<div class="faq mb-3"><div class="faq-header" id="heading{i}"><h3 class="-serif"><button class="btn btn-link btn-block px-4 py-3 text-left" type="button" data-toggle="collapse" data-target="#collapse{i}" aria-expanded="true" aria-controls="collapse{i}">{question}</button></h3></div><div id="collapse{i}" class="collapse show" aria-labelledby="heading{i}"><div class="faq-body py-3 px-4">{answer}</div></div></div>',
                templateMiddleware: Function.prototype,
                sortMiddleware: function () {
                    return 0;
                },
                noResultsText: "No results found",
                limit: 50,
                fuzzy: !1,
                debounceTime: null,
                exclude: [],
            },
            debounceTimeout;
        const debounce = function (func, delay) {
            delay ? (clearTimeout(debounceTimeout), (debounceTimeout = setTimeout(func, delay))) : func.call();
        };
        var requiredOptions = ["searchInput", "resultsContainer", "json"];
        const optionsValidator = new OptionsValidator({ required: requiredOptions });
        function initializeSearch(input) {
            Storage.put(input),
                SearchConfig.searchInput.addEventListener("input", function (event) {
                    -1 === [13, 16, 20, 37, 38, 39, 40, 91].indexOf(event.which) &&
                        (clearResults(),
                        debounce(function () {
                            performSearch(event.target.value);
                        }, SearchConfig.debounceTime));
                });
        }
        function clearResults() {
            SearchConfig.resultsContainer.innerHTML = "";
        }
        function displayResults(html) {
            SearchConfig.resultsContainer.innerHTML += html;
        }
        function performSearch(query) {
            var sanitizedQuery;
            (sanitizedQuery = query) &&
                0 < sanitizedQuery.length &&
                (clearResults(),
                (function (data, query) {
                    var resultLength = data.length;
                    if (0 === resultLength) return displayResults(SearchConfig.noResultsText);
                    for (let i = 0; i < resultLength; i++) (data[i].query = query), displayResults(SearchEngine.compileTemplate(data[i]));
                })(Storage.search(query), query));
        }
        function throwError(message) {
            throw new Error("SimpleJekyllSearch --- " + message);
        }
        (window.SimpleJekyllSearch = function (options) {
            var searchInstance;
            0 < optionsValidator.validate(options).length && throwError("You must specify the following required options: " + requiredOptions),
                (SearchConfig = Utility.mergeObjects(SearchConfig, options)),
                SearchEngine.setOptions({ template: SearchConfig.searchResultTemplate, middleware: SearchConfig.templateMiddleware }),
                Storage.setOptions({ fuzzy: SearchConfig.fuzzy, limit: SearchConfig.limit, sort: SearchConfig.sortMiddleware, exclude: SearchConfig.exclude }),
                Utility.isJSONObject(SearchConfig.json)
                    ? initializeSearch(SearchConfig.json)
                    : ((dataSource = SearchConfig.json),
                      HTTPRequest.load(dataSource, function (err, data) {
                          err && throwError("failed to get JSON (" + dataSource + ")"), initializeSearch(data);
                      }));
            searchInstance = { search: performSearch };
            return "function" == typeof SearchConfig.successCallback && SearchConfig.successCallback.call(searchInstance), searchInstance;
        });
    })(window);
  })();
