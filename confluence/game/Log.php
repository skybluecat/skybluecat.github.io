<?php

$POST = json_decode(file_get_contents('php://input'));

//try {
	$user = $_POST["user"];
	$attempt = $_POST["attempt"];
	$field = $_POST["field"];
	$value = $_POST["value"];


	// File used to log data for this field
	$logfile = "/web/mentorship/logs/".$field.".csv";

	// Build string to append
	$data = $user.",".$attempt.",".$value;

	// Append to file
	//$log = fopen($logfile, "a") or die("Unable to open file!");
	//file_put_contents($log, $data);
	shell_exec("echo '".$data."' >> ".$logfile);


	echo "Logged! ".$data." for field: ".$field;
?>