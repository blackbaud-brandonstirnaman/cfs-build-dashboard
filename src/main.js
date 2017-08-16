var devBuildDefName = 'docker-go-moonshot';
var testBuildDefName = 'giftsonline';
var baseIssueURL = 'https://microedge.visualstudio.com/MEProduct/_workitems?id=';
var devBuildDefId = 302;
var testBuildDefId = 328;
var devDeployDefId = 148;
var testDeployDefId = 169;

var hrWindow = 48;

function showBuilds() {
  loadBuilds().then(function(d){
    var oldBuildsTemplate = Handlebars.compile( $("#old-builds-template").html());
    $("#old-builds-template").html(oldBuildsTemplate({data: d.oldBuilds}));
    $("#old-builds-template").css('display', 'block');

    var changesPromises = [];

    for(var i = 0; i < d.recentBuilds.length; i++) {
      if (!d.recentBuilds[i].build.isTest) {
        changesPromises.push({build: d.recentBuilds[i].build, promise: getBuildChanges(d.recentBuilds[i].build.id)});
      }
    }

    var getChanges = function() {
      return $.when.apply($, $.map(changesPromises, function(chgProm) {
        var def = new $.Deferred();
        chgProm.promise.done(function(chg){
          chgProm.build.changes = chg.value;
          def.resolve();
        });
        return def;
      })).promise();
    };

    getChanges().done(function() {
      console.log(d.recentBuilds);

      for(var i = 0; i < d.recentBuilds.length; i++) {
        if (d.recentBuilds[i].build.changes){
          for(var j = 0; j < d.recentBuilds[i].build.changes.length; j++) {
            var issueNumberRegex = /[0-9]{5,}/g;
            //this only matches on the first find
            var fndIssueNum = issueNumberRegex.exec(d.recentBuilds[i].build.changes[j].message);
            if (fndIssueNum !== null) {
              d.recentBuilds[i].build.changes[j].issueURL = baseIssueURL + fndIssueNum[0];
            }
          }
        }
      }

      var recentBuildsTemplate = Handlebars.compile( $("#recent-builds-template").html());
      $("#recent-builds-template").html(recentBuildsTemplate({data: d.recentBuilds, window: hrWindow}));
      $("#recent-builds-template").css('display', 'block');
    });
  })
};

function loadBuilds() {
  var loadBuildsPromise = jQuery.Deferred();

  $.when(getDevBuilds(), getDevReleases(), getTestBuilds(), getTestReleases()).done(
    function ( devBuildDataIn, devReleaseDataIn, testBuildDataIn, testReleaseDataIn ) {
      if (devBuildDataIn[1] === 'success' && devReleaseDataIn[1] === 'success'){
        var devBuildDataArr = devBuildDataIn[0].value;
        var devReleaseDataArr = devReleaseDataIn[0].value;
        var testBuildDataArr = testBuildDataIn[0].value;
        var testReleaseDataArr = testReleaseDataIn[0].value;

        for (var i = 0; i < testBuildDataArr.length; i++){
          testBuildDataArr[i].isTest = true;
        }
        for (var i = 0; i < testReleaseDataArr.length; i++){
          testReleaseDataArr[i].isTest = true;
        }

        var builds = devBuildDataArr.concat(testBuildDataArr);

        builds = builds.sort(function(a, b){
          return b.id - a.id;
        });

        var dateTimeMax = new moment().subtract(hrWindow, 'h');
        var recentBuilds = [];
        var oldBuilds = [];

        for (var i = 0; i < builds.length; i++) {
          var buildData = builds[i];
          var queueTime = new moment(buildData.queueTime);

          var releaseData;

          if (buildData.isTest){
            releaseData = testReleaseDataArr.filter(function(d){
              return d.name == testBuildDefName + '-' + moment(d.createdOn).format('YYYYMMDD') + '-' + buildData.id + '-1'; //TODO handle multiple releases
            });
          }
          else {
            releaseData = devReleaseDataArr.filter(function(d){
              return d.name == devBuildDefName + '-' + buildData.id + '-1'; //TODO handle multiple releases
            });
          }

          buildData.prettyStartDateTime = moment(buildData.startTime).format("dddd, MMMM Do YYYY, h:mm:ss a");

          if (queueTime.isAfter(dateTimeMax)) {
            recentBuilds.push({build: buildData, release: releaseData});
          }
          else {
            oldBuilds.push({build: buildData, release: releaseData});
          }

          if (i === builds.length - 1){
            loadBuildsPromise.resolve({recentBuilds: recentBuilds, oldBuilds: oldBuilds});
          }
        }
      }
      else {
        loadBuildsPromise.reject('Error retrieving build or release data');
      }
    });

  return loadBuildsPromise;
}

function getDevBuilds() {
  return makeVSTSGet('/_apis/build/builds?api-version=2.0&path=%5CGiftsOnline&definitions=' + devBuildDefId);
}

function getDevReleases() {
  return makeVSTSGet('/vsrm/_apis/release/releases?api-version=3.0-preview.2&definitionId=' + devDeployDefId + '&$expand=approvals')
}

function getTestBuilds() {
  return makeVSTSGet('/_apis/build/builds?api-version=2.0&path=%5CGiftsOnline&definitions=' + testBuildDefId);
}

function getTestReleases() {
  return makeVSTSGet('/vsrm/_apis/release/releases?api-version=3.0-preview.2&definitionId=' + testDeployDefId + '&$expand=approvals')
}

function getBuildChanges(buildId) {
  return makeVSTSGet('/_apis/build/builds/' + buildId + '/changes?api-version=2.0');
}

function makeVSTSGet(url) {
  return $.ajax
  ({
    type: "GET",
    url: url,
    dataType: 'json',
    async: false
  });
}
