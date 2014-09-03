var request = require("request");
var cheerio = require("cheerio");
var async = require('async');
var express = require('express');
var router = express.Router();

var team = [
  'seanberto',
  'levelos',
  'gcb',
  'tauno',
  'nadavoid',
  'MadouPDX',
  'ruscoe',
  '6c1',
  'heypaxton',
  'caxy4'
];

var base_url = 'https://drupal.org';
var base_user_url = base_url + '/u/';

var projects = {};
var users = {};

/* GET home page. */
router.get('/', function(req, res) {
  loadData(function() {
    res.render('index', {
      projects: projects,
      users: users
    });
  });
});

module.exports = router;

function loadData(callback) {
  async.each(team, loadUserProjects, function(err) {
    async.each(Object.keys(projects), loadProjects, function(err) {
      // Sort by key.
      var sorted = {};
      Object.keys(projects)
        .sort()
        .forEach(function (k) {
          sorted[k] = projects[k];
        });
      projects = sorted;
      callback();
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

    var commits_raw = $projects.last().text().toString().trim();
    var commits = commits_raw.substring(7, commits_raw.indexOf('commits'));

    $projects.each(function () {
      var $project_link = $('a', this);

      // There may be some other items in this list.
      if ($project_link.length === 0) {
        return false;
      }

      // Exclude sandbox projects.
      if ($project_link.attr('href').indexOf('sandbox') > -1) {
        return false;
      }

      var project_name = $project_link.attr('href').split('/').pop();
      projects[project_name] = {
        'url': base_url + $project_link.attr('href'),
        'name': $project_link.text()
      };
    });

    users[name] = {
      'commits': commits,
      'url': base_user_url + name
    };

    callback();
  })
}

function loadProjects(project_name, callback) {
  if (projects[project_name].latest) return;

  request(base_url + '/project/usage/' + project_name, function(err, resp, html) {
    $projectDom = cheerio.load(html);
    var $latest = $projectDom('#project-usage-project-api tbody tr').first();
    var count = $projectDom('td', $latest).last().html();
    var date = $projectDom('td', $latest).first().html();
    projects[project_name].usage = count;
    projects[project_name].date = date;
    callback();
  });
}