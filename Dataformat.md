# Queue

List of jobs to execute.
The server adds jobs and subscribes to it

# Job

`$script $args`
hash( $script + $args )

# Jobs

`jobs`
List of all jobs in progress

`job:$job`
Map containing properties sent with the job

`job:$job:results`
Map providing results from the job

# File reference

hash( hash($file.contents) + $file.size)

# File

`$hash`

Map of properties:
- name
- type (image, video, text, etc)
- source (path, uri, etc)

# Analysis

`$hash:analysis`
Map of simple properties
- length

`$hash:analysis:index`
List of all computed analysis

`$hash:analysis:$type`
Map of properties used as configuration when running analysis

`$hash:analysis:$type:$*`
Different depending on type of analysis, `data` normally, which can be an array

# Tags

`$hash:tags`
List of tag names

`tag:$name`
List of items
