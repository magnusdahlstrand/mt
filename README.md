# MT

A layered command structure much like git's is used, which means to add a new command all that is needed to do is add an executable file to the root, following the naming pattern: `mt-command`.

The naming pattern can be extended for subcommands: `mt-command-sub`. You have to ensure the main command already exists for a subcommand to work.

## Jobs

Jobs are added to queue, their properties to a map at $jobId

Scheduler gets job ID and fetches the job, and runs it.

### List active jobs

`mt jobs`

### Stop jobs

`mt jobs stop`

Without arguments all jobs are stopped, alternatively send in one or more job references as returned by `mt jobs` to selectively stop jobs:

`mt jobs stop <ref>`


## Files

### Add file

`mt add <path>`

### List files

`mt list`

### Remove file

Pass in one or more references to remove files.

`mt rm <ref>`


## Tags

### Add tag

Pass in one or more file references, and tags in plain text (without spaces).

`mt tag <ref> with <tag>`

### List tags

`mt tags`

### List items with tag

Pass in one or more tags and items with all the listed tags will be returned.

`mt tags <tag>`


## MIDI

### List MIDI ports

`mt midi`

### Route MIDI

The order of input and output does not matter, since inputs are indexed by character and outputs by number.

`mt midi route <input> <output>`