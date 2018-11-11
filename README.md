# ssh-ec2

A tool that helps you ssh into EC2 servers using tags, so you do not need to
instead of paste the IP address into your terminal

## AWS EC2 Tags

This tool assumes your instances have certain tags in EC2:

- `environmentName` corresponding to the environment they belong to, such as
  `staging`, `production`, or something else.
- `serverRole` indicating what this server does. It might be `backend` or `api`
  or `database`.

## Installation

```bash
git clone <this repo>
cd to/this/repo

npm install -g

# now check that installation worked by running it
ssh-ec2
```

```plain
No .ssh-ec2.json file in your HOME directory, run ssh-ec2 --generate-config
no creds!
```

## Configuration

Call `ssh-ec2 --generate-config` and follow the instructions to create a local
settings file with your Access Key ID and Secret Access Key.

```plain
No .ssh-ec2.json file in your HOME directory, run ssh-ec2 --generate-config
Username: ruffrey
Access Key: <redacted>
Secret Key: <redacted>
```

## Setup

Set which regions you want to access using `ssh-ec2 --set-regions`

```plain
prompt: Enable Region ap-northeast-1 (Asia Pacific (Tokyo))
 [y/n]::  n
prompt: Enable Region ap-southeast-1 (Asia Pacific (Singapore))
 [y/n]::  n
prompt: Enable Region ap-southeast-2 (Asia Pacific (Sydney))
 [y/n]::  n
prompt: Enable Region eu-central-1 (EU (Frankfurt))
 [y/n]::  n
prompt: Enable Region eu-west-1 (EU (Ireland))
 [y/n]::  n
prompt: Enable Region sa-east-1 (South America (Sao Paulo))
 [y/n]::  n
prompt: Enable Region us-east-1 (US East (N. Virginia))
 [y/n]::  y
prompt: Enable Region us-west-1 (US West (N. California))
 [y/n]::  y
prompt: Enable Region us-west-2 (US West (Oregon))
 [y/n]::  y
prompt: All OK?
 [y/n]::  y
```

Get a list of all services using `ssh-ec2 --get-services`

Get a list of all environments using `ssh-ec2 --get-environments`

## Help

`ssh-ec2 --help` will list all of your known services and environments.

## Using the tool

```bash
ssh-ec2 <serverRole> <environmentName>
# or an example
ssh-ec2 redis staging
```

If there is only one server, it'll auto SSH in, if there is more than 1, it'll Ask you!

## Known issues

Frankfurt (eu-central) messes things up!! I have disabled it as an option for now
Could be better at telling you when theres an issue

##How to get tab autocompletion

```
ssh-ec2 completion > /usr/local/etc/bash_completion.d/ssh-ec2
```

OR

```
ssh-ec2 completion >> .bash_profile
```

OR

Something similar depending on your setup

### License

MIT
