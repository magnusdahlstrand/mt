#!/usr/bin/env bash

# finds commands for the input
# supports nested commands

mt_path=$(realpath "$0")
mt_root=$(dirname "$mt_path")

pad() {
	echo "  "
}

list_available_commands() {
	echo "mt"
	ls $mt_root | grep mt- | sed s/mt-// | xargs printf "   %s\n"
}
pick_command() {
	cmd_path="$mt_root/mt"
	while true; do
		if [[ -z "$1" ]]; then
			break
		fi
		if [[ -x "$cmd_path-$1" ]]; then
			cmd_path=$cmd_path-$1
			shift
		else
			break
		fi
	done
	cmd_path=$(realpath "$cmd_path")
	if [[ "$cmd_path" == "$mt_path" ]]; then
		list_available_commands
		exit 1
	else
		run_command "$cmd_path" $@
	fi
}

run_command() {
	cd "$mt_root" && PATH=.:./lib:$PATH "$@"
}
if [[ -z "$1" ]]; then
	# if no command, list all available
	list_available_commands
else
	pick_command $@
fi
