# ssh-ec2

## Configuration

Call `ssh-ec2 --generate-config` and follow the instructions

## Setup

Set which regions you want to access using `ssh-ec2 --set-regions`

Get a list of all services using `ssh-ec2 --get-services`

Get a list of all environments using `ssh-ec2 --get-environments`

## Help

`ssh-ec2 --help`

## Using the tool

`ssh-ec2 <service-name> <environment>`

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
