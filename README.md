# ssh-ec2

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

Call `ssh-ec2 --generate-config` and follow the instructions

## Setup

Set which regions you want to access using `ssh-ec2 --set-regions`

Get a list of all services using `ssh-ec2 --get-services`

Get a list of all environments using `ssh-ec2 --get-environments`

## Help

`ssh-ec2 --help`

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
