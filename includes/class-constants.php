<?php
/**
 * Plugin Constants
 *
 * Centralized configuration for easily modifiable values.
 *
 * @package Tmpltr
 */

defined('ABSPATH') or die();

class TmpltrConstants {

	// ===== GENERATOR SERVER =====
	const GENERATOR_SERVER_URL = 'wss://tmpltr-server-58a18b126e87.herokuapp.com/';

	// ===== EXTERNAL LINKS =====
	const WEBSITE_URL = 'https://tmpltr-website.vercel.app/';
	const CREDIT_LOGS_URL = self::WEBSITE_URL . 'credit-logs';

	// ===== PLUGIN UPDATES =====
	const GITHUB_REPO_URL = 'https://github.com/francis150/tmpltr/';
}
