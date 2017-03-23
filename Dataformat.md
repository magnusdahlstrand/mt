List of jobs to execute.
The server adds jobs and subscribes to it

# Job

$job is sha256( $script:$args )
where $args is keyvalue pairs like `key=value`, sorted by key and concatenated by `:`

`job:$job`
Map containing properties sent with the job

# Jobs

`jobs`
Set of all jobs in progress

`job:$job:results`
Map providing results from the job

When a new job is added to the list of jobs, its jobId will broadcast on the `new:job` channel

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
