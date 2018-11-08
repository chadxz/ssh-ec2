#!/bin/bash

cd $(dirname "${BASH_SOURCE[0]}")

REALFILE=$(readlink "${BASH_SOURCE[0]}")

DIR=$(dirname $REALFILE)

ROOT_DIR="$( cd $DIR && pwd )"

if [ "$1" == "completion" ];then
	$ROOT_DIR/lib/ssh-ec2.js "$@"
else

	X=$($ROOT_DIR/lib/ssh-ec2.js "$@" | tee /dev/stderr)

	if [ $? -gt 0 ];then
		echo $X
	 	exit $?
	fi

	if [ $# == 0 ];then
	 	exit 1
	fi


	if [[ "$X" == *Command:* ]];then
	  	SSH=${X#*Command: }
		$SSH
	fi

fi
