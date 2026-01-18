<?php
/**
 * Plugin Update Checker
 *
 * @package Tmpltr
 */

defined('ABSPATH') or die();

class TmpltrUpdater {

	private $update_checker = null;
	private $plugin_file;

	public function __construct($plugin_file) {
		$this->plugin_file = $plugin_file;
		$this->init();
	}

	private function init() {
		$library_path = TMPLTR_PLUGIN_DIR . 'lib/plugin-update-checker/plugin-update-checker.php';

		if (!file_exists($library_path)) {
			$this->log('Plugin Update Checker library not found.');
			return;
		}

		require_once $library_path;

		if (!class_exists('YahnisElsts\PluginUpdateChecker\v5\PucFactory')) {
			$this->log('PucFactory class not found.');
			return;
		}

		try {
			$this->update_checker = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
				TmpltrConstants::GITHUB_REPO_URL,
				$this->plugin_file,
				'tmpltr'
			);

			$this->update_checker->getVcsApi()->enableReleaseAssets();

		} catch (\Exception $e) {
			$this->log('Failed to initialize: ' . $e->getMessage());
		}
	}

	private function log($message) {
		if (defined('TMPLTR_DEBUG_MODE') && TMPLTR_DEBUG_MODE) {
			error_log('[Tmpltr Updater] ' . $message);
		}
	}
}
