function donwloadFile(content, name) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', name);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element)
}

function rowToJson(row, headerNames) {
  var json = {};

  $(row).find('td').each(function (index) {
    var value = $(this).text()
      .split('\n')
      .map(function (text) {
        return text.trim();
      })
      .filter(function (text) {
        return text;
      });

    if (value.length <= 1)
      value = value[0];

    json[headerNames[index]] = value;
  });

  return json;
}

function getTables($$) {
  var tables = [];

  $$.find('table').each(function () {
    //remove inner tables
    $(this).find('table').remove();

    var table = [];

    var rows = $(this).find('tr');
    if (!rows.length)
      return;

    var firstRow = $(rows[0]);
    if (firstRow.find('th').length && firstRow.find('td').length) {
      //key-value table
      rows.each(function () {
        var row = {};

        row[$(this).find('th').text().trim()] = $(this).find('td').text().trim();

        table.push(row);
      });
    }
    else if (firstRow.find('th').length) {
      //normal table
      var headerNames = [];
      firstRow.find('th').each(function () {
        headerNames.push($(this).text().trim());
      });

      rows.slice(1).each(function () {
        table.push(rowToJson(this, headerNames));
      });
    }
    else {
      //some misguided person went bananas
      rows.each(function () {
        var row = [];

        $(this).children().each(function (index) {
          var value = $(this).text()
            .split('\n')
            .map(function (text) {
              return text.trim();
            })
            .filter(function (text) {
              return text;
            });

          if (value.length <= 1)
            value = value[0];

          row.push(value);
        });

        table.push(row);
      });
    }

    tables.push(table);
  });

  return tables;
}

function getLists($$) {
  var lists = [];

  $$.find('ul').each(function () {
    const list = [];

    $(this).find('li').each(function (i, e) {
      //remove the inner ul
      $(this).find('ul').remove();

      var value = $(this).text()
        .split('\n')
        .map(function (text) {
          return text.trim();
        })
        .filter(function (text) {
          return text;
        });

      if (value.length <= 1)
        value = value[0];

      if (value)
        list.push(value);
    });

    lists.push(list);
  });

  return lists;
}

function getLinks($$, url) {
  var links = [];

  $$.find('a').each(function (i, e) {
    let link = $(this).attr('href');
    link = link && link.trim();

    if (!link)
      return;
    else if (link.startsWith('#'))
      return;
    else if (link.startsWith('/'))
      link = (url.match(/.+?\/.+?\//)[0] + link).replace(/\/\//g, '/');
    else if (link.indexOf('://') > -1)
      link;
    else
      link = (url.match(/.+?\/.+?\//)[0] + '/' + link).replace(/\/\//g, '/');

    links.push(link);
  });

  return links;
}

function htmlToJson(html, url, date) {
  var $$ = $(html);
  var json = {};

  json.url = url;
  json.date = date;

  json.tables = getTables($$);

  json.lists = getLists($$);

  json.links = getLinks($$, url);

  return json;
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.action == 'getSource') {
    var date = new Date();
    var json = htmlToJson(request.source, request.url, date);
    donwloadFile(JSON.stringify(json, null, 2), request.url + date.toJSON() + '.json')
  }
});

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript(null, {
    code: 'chrome.runtime.sendMessage({ \
      action: "getSource", \
      url: window.location.href, \
      source: document.documentElement.outerHTML\
    });'
  });
});