var request = require("request");
var cheerio = require("cheerio");
var async = require('async');
var express = require('express');
var app = express();

var team = [
  'seanberto',
  'levelos',
  'gcb',
  'tauno',
  'nadavoid',
  'MadouPDX',
  'ruscoe',
  '6c1',
  'heypaxton'
];

var base_url = 'https://drupal.org/';
var base_user_url = base_url + 'u/';

var projects = {};

app.get('/', function(req, res) {
  var content = loadData();
  res.send(projects);
});

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});

function loadData() {
  async.each(team, loadUserProjects, function(err) {
    async.each(Object.keys(projects), loadProjects, function(err) {
//      console.log(projects.sort());
    });
  });
}

function loadUserProjects(name, callback) {
  request(base_user_url + name, function (err, resp, html) {
    if (err) throw err;
    $ = cheerio.load(html);

    var $projects = $('h3').filter(function (i, el) {
      return $(el).html() === 'Projects';
    }).next().children().find('li');

    $projects.each(function () {
      var $project_link = $('a', this);

      // There may be some other items in this list.
      if ($project_link.length === 0) {
        return false;
      }

      var project_name = $project_link.attr('href').split('/').pop();
      projects[project_name] = {
        'url': $project_link.attr('href'),
        'name': $project_link.text()
      };
    });

    callback();
  })
}

function loadProjects(project_name, callback) {
  if (projects[project_name].latest) return;

  request(base_url + 'project/usage/' + project_name, function(err, resp, html) {
    $projectDom = cheerio.load(html);
    $latest = $projectDom('td', $projectDom('#project-usage-project-api tbody tr').first()).last();
    projects[project_name].latest = $latest.html();
    callback();
  });
}
