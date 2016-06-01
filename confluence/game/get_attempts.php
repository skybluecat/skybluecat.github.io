<?php

$POST = json_decode(file_get_contents('php://input'));

$user = $_POST["user"];

$stamp_dir = "/web/mentorship/tmp/";

// Check if there's any stamp for this user to retrieve


?>