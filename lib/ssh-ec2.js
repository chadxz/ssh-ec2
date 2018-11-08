#!/usr/bin/env node

var program = require('commander');
var fs = require('fs');
var AWS = require('aws-sdk');
var prom = require('prompt');
var tabtab = require('tabtab');
var rimraf = require('rimraf');
var colours = require('colors');
var async = require('async');
var _ = require('lodash');

var getUserHome = function(){
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

var availableRegions = {
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-southeast-2': 'Asia Pacific (Sydney)',
  'eu-central-1': 'EU (Frankfurt)',
  'eu-west-1': 'EU (Ireland)',
  'sa-east-1': 'South America (Sao Paulo)',
  'us-east-1': 'US East (N. Virginia)',
  'us-west-1': 'US West (N. California)',
  'us-west-2': 'US West (Oregon)'
}

var HOME = getUserHome() + '/';

var accessKey = '';
var secretKey = '';
var username = '';
var regions = [];

program
  .version('0.0.1')
  .usage('<service> <env>');

var ssh = function(service, env, instance){
  console.log(['Command: ssh', '-o', 'UserKnownHostsFile=/dev/null', '-o', 'StrictHostKeyChecking=no', username + '@' + instance].join(' '));
  process.exit(0);
};

var findEnvironments = function(cb){

  var environmentList = [];

  async.each(regions, function(region, callback){
    var ec2 = new AWS.EC2({region: region});

    ec2.describeTags({
      Filters: [
        {
          Name: 'key',
          Values: [
            'environmentName',
          ]
        }
      ],
    }, function(err, data) {
      if (err) {
        return callback(err);
      }


      data.Tags.forEach(function(environment){
        if (environmentList.indexOf(environment.Value) === -1) {
          environmentList.push(environment.Value);
        }
      });

      callback(null, environmentList);

    });
  }, function(err){

    if(err){
      return cb(err);
    }

    cb(null, environmentList);
  });
};

var findServices = function(cb){

  var servicesList = [];

  async.each(regions, function(region, callback){
    var ec2 = new AWS.EC2({region: region});

    ec2.describeTags({
      Filters: [
        {
          Name: 'key',
          Values: [
            'serverRole',
          ]
        }
      ],
    }, function(err, data) {
      if (err) {
        return callback(err);
      }

      data.Tags.forEach(function(service){
        if (servicesList.indexOf(service.Value) === -1) {
          servicesList.push(service.Value);
        }
      });

      callback(null);
    });

  }, function(err){

    if(err){
      return cb(err);
    }

    cb(null, servicesList);
  });

};

var readConfiguration = function(){

  if(!fs.existsSync(HOME + '.ssh-ec2.json')){
    console.log('No .ssh-ec2.json file in your HOME directory, run ssh-ec2 --generate-config');
  }

  var configuration = {};
  try{
    configuration = require(HOME + '.ssh-ec2.json');
  }catch(e){
    configuration = {
      credentials: {},
      services: [],
      environments: [],
      regions: []
    };
  }

  if(configuration.credentials && configuration.credentials.hasOwnProperty('accessKey')){
    accessKey = configuration.credentials.accessKey;
    secretKey = configuration.credentials.secretKey;
    username = configuration.credentials.username;
    regions = configuration.regions || ['us-west-1'];
  }

  AWS.config.update({accessKeyId: accessKey, secretAccessKey: secretKey });

  return configuration;
};

var findEc2Instances = function(service, env){

  var ins = {};

  async.each(regions, function(region, cb){
    var ec2 = new AWS.EC2({region: region});

    var options = {
      Filters: [
        {
          Name: 'tag:serverRole',
          Values: [service]
        },
        {
          Name: 'tag:environmentName',
          Values: [env]
        }
      ]
    };

    ec2.describeInstances(options, function(err, data) {
      if(err){
        console.log('Error, region', region, err);
        cb(err);
      }

      var reservations = data.Reservations;
      reservations.forEach(function(reservation){
        var count = 0;
        reservation.Instances.forEach(function(instance){
          count++;
          if(instance.PublicDnsName){
            var i = Object.keys(ins).length;
            var namekv = _.find(instance.Tags, function(kv) {
              return kv.Key === 'Name';
            });
            ins[i++] = {
              region: region,
              instance: instance.PublicDnsName,
              name: namekv && namekv.Value
            };
          }
        });
      });

      cb();

    });
  }, function(err){
    if(err){
      console.log('Error from EC2 API' + err);
      process.exit(1);
    }

    prompt(service, env, ins);
  });

};

var prompt = function(app, env, instances){
  if(Object.keys(instances).length){
    var message = ['Login to which EC2 Instance?'];
    var count = 1;

    if(Object.keys(instances).length === 1){
      console.log('Only one instance, ', instances[0].instance, instances[0].region);
      return ssh(app, env, instances[0].instance);
    }

    Object.keys(instances).forEach(function(instance){
      message.push(count + ') ' + (instances[instance].name || instances[instance].instance) + ' (' + instances[instance].region + ')' );
      count++;
    });

    var displayPrompt = function(){
      prom.message = ''.green;
      prom.delimiter = '\n\n'.green;//hackery

      prom.start();

      prom.get({
        properties: {
          instance: {
            description: message.join('\n').green
          }
        }
      }, function (err, result) {
        if(result.instance / 1 < 1 || result.instance / 1 > count ){
          console.log('Incorrect choice, please try again');
          displayPrompt();
        }else{
          ssh(app, env, instances[(result.instance / 1) - 1].instance);
        }
      });
    };

    displayPrompt();

  }else{
    console.log('No instances found');
    process.exit(1);
  }
};

var configuration = readConfiguration();

if(process.argv.slice(2)[0] === 'completion') return tabtab.complete('ssh-ec2', function(err, data) {
  // simply return here if there's an error or data not provided.
  // stderr not showing on completions
  if(err || !data) return;

  if(data.words === 1){
    tabtab.log(configuration.services.filter(function(app){
      return (new RegExp('^' + data.last)).test(app);
    }), data);
  }

  if(data.words === 2){
    tabtab.log(configuration.environments.filter(function(env){
      return (new RegExp('^' + data.last)).test(env);
    }), data);
  }
});

configuration.services.forEach(function(service){

  var envs = configuration.environments;

  program
    .command(service + ' <env>')
    .description('SSH into ' + service + ' with an environment of ' + envs.join('/'))
    .action(function(env){
      if (!env) {
        env = production;
      }

      findEc2Instances(service, env);
    });
});

program.option('--generate-config', 'Generate the config')
  .option('--get-environments', 'Generate a list of environments')
  .option('--get-services', 'Generate a list of services')
  .option('--set-regions', 'Set which regions to communicate with');

program.parse(process.argv);

if(!program.generateConfig && configuration.credentials && !configuration.credentials.hasOwnProperty('accessKey')){
  console.log('no creds!');
  process.exit(1);
}

// if(Object.keys(program).length > 1){
//   console.log('can only do one action at once at the moment');
//   process.exit(1);
// }

if(program.getEnvironments){
  var configuration = readConfiguration();

  findEnvironments(function(err, envs){
    configuration.environments = envs;
    fs.writeFileSync(HOME + '.ssh-ec2.json', JSON.stringify(configuration, null, 2));
  })

}

if(program.getServices){
  findServices(function(err, services){
    configuration.services = services;
    fs.writeFileSync(HOME + '.ssh-ec2.json', JSON.stringify(configuration, null, 2));
  })
}

if(program.setRegions){
  configuration.regions = [];
  async.eachSeries(Object.keys(availableRegions), function(region, cb){
    prom.start();
    prom.get({
      properties: {
        confirm: {
          description: 'Enable Region ' + region + ' (' + availableRegions[region] + ')\n [y/n]:'.green
        }
      }
    }, function (err, result) {
      if(result.confirm === 'y' ){
        configuration.regions.push(region);
      }
      cb();
    });
  }, function(err){
    prom.start();
    prom.get({
      properties: {
        confirm: {
          description: 'All OK?\n [y/n]:'.green
        }
      }
    }, function (err, result) {
      if(result.confirm === 'y' ){
        fs.writeFileSync(HOME + '.ssh-ec2.json', JSON.stringify(configuration, null, 2));
      }else{
        console.log('Quitting...');
        process.exit(0);
      }
    });
  })

}

if(program.generateConfig){

  var configuration = readConfiguration();

  prom.message = ''.green;
  prom.delimiter = ''.green;//hackery

  var confirm = function(){
    prom.start();
    prom.get({
      properties: {
        confirm: {
          description: 'Confirm settings:\nUsername: ' + configuration.credentials.username + '\nAccess Key: ' + configuration.credentials.accessKey + '\nSecret Key: ' + configuration.credentials.secretKey + '\n [y/n]:'.green
        }
      }
    }, function (err, result) {
      if(result.confirm === 'y' ){
        fs.writeFileSync(HOME + '.ssh-ec2.json', JSON.stringify(configuration, null, 2));
      }else{
        console.log('Quitting...');
        process.exit(1);
      }
    });
  };

  var getEnv = function(){
    prom.start();
    prom.get({
      properties: {
        username: {
          description: 'Username:'
        },
        accessKey: {
          description: 'Access Key:'
        },
        secretKey: {
          description: 'Secret Key:'
        }
      }
    }, function (err, result) {
      if(result.accessKey !== '' && result.secretKey !== '' && result.username != ''){

        configuration.credentials = {
          username: result.username,
          accessKey: result.accessKey,
          secretKey: result.secretKey
        };

        confirm();
      }else{
        console.log('Not all info given, quitting...');
        process.exit(1);
      }
    });
  };


  if(configuration.credentials && configuration.credentials.hasOwnProperty('accessKey')){
    prom.start();

    prom.get({
      properties: {
        overwrite: {
          description: 'Settings already exists, do you want to overwrite? [y/n]'
        }
      }
    }, function (err, result) {
      if(result.overwrite === 'y' ){
        getEnv();
      }else{
        console.log('Quitting...');
        process.exit(1);
      }
    });
  }else{
    getEnv();
  }

}

