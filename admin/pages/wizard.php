<?php
/**
 * Setup Wizard Page
 *
 * @package Tmpltr
 */

defined('ABSPATH') or die();
?>

<div class="tmpltr-admin-page tmpltr-auth-page tmpltr-wizard">
    <div class="tmpltr-wizard__card">
        <div class="tmpltr-wizard__progress">
            <div class="tmpltr-wizard__progress-fill"></div>
        </div>

        <!-- Step 1: Welcome -->
        <div class="tmpltr-wizard__step" data-step="1">
            <div class="tmpltr-wizard__welcome">
                <h1>Welcome to Tmpltr</h1>
                <p class="tmpltr-wizard__subtitle">Create AI-powered pages in minutes. Design a template once, then generate unlimited unique pages by filling in a few fields.</p>

                <div class="tmpltr-wizard__features">
                    <div class="tmpltr-wizard__feature">
                        <div class="tmpltr-wizard__feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </div>
                        <h3>Design Template</h3>
                        <p>Create a page template with custom fields and AI prompts</p>
                    </div>
                    <div class="tmpltr-wizard__feature-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c3c4c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                    <div class="tmpltr-wizard__feature">
                        <div class="tmpltr-wizard__feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                        </div>
                        <h3>Fill Fields</h3>
                        <p>Enter your details like city, business name, or keywords</p>
                    </div>
                    <div class="tmpltr-wizard__feature-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c3c4c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                    <div class="tmpltr-wizard__feature">
                        <div class="tmpltr-wizard__feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </div>
                        <h3>AI Generates</h3>
                        <p>Get a fully written, SEO-optimized page in seconds</p>
                    </div>
                </div>

                <p class="tmpltr-wizard__account-note">A free Tmpltr account is required to use AI generation credits.</p>

                <div class="tmpltr-wizard__actions">
                    <button type="button" class="button button-secondary tmpltr-wizard__skip-btn">I'll do this later</button>
                    <button type="button" class="button button-primary button-hero tmpltr-wizard__start-btn">Get Started</button>
                </div>
            </div>
        </div>

        <!-- Step 2: Account -->
        <div class="tmpltr-wizard__step" data-step="2">
            <div class="tmpltr-wizard__account">
                <h1>Create Your Account</h1>

                <div class="tmpltr-wizard__auth-tabs">
                    <button type="button" class="tmpltr-wizard__auth-tab tmpltr-wizard__auth-tab--active" data-tab="register">Create Account</button>
                    <button type="button" class="tmpltr-wizard__auth-tab" data-tab="login">Sign In</button>
                </div>

                <div class="tmpltr-wizard__auth-layout">
                    <div class="tmpltr-wizard__auth-forms">
                        <!-- Register Panel -->
                        <div class="tmpltr-wizard__auth-panel tmpltr-wizard__auth-panel--active" data-panel="register">
                            <form id="tmpltr-wizard-register-form" class="tmpltr-wizard__form">
                                <div class="tmpltr-wizard__form-group">
                                    <label for="wizard-register-name">Name</label>
                                    <input type="text" id="wizard-register-name" name="name" class="regular-text" required>
                                </div>
                                <div class="tmpltr-wizard__form-group">
                                    <label for="wizard-register-email">Email</label>
                                    <input type="email" id="wizard-register-email" name="email" class="regular-text" required>
                                </div>
                                <div class="tmpltr-wizard__form-group">
                                    <label for="wizard-register-password">Password</label>
                                    <input type="password" id="wizard-register-password" name="password" class="regular-text" required>
                                </div>
                                <div class="tmpltr-wizard__form-group">
                                    <label for="wizard-register-password-confirm">Confirm Password</label>
                                    <input type="password" id="wizard-register-password-confirm" name="password_confirm" class="regular-text" required>
                                </div>
                                <button type="submit" class="button button-primary button-hero">Create Account</button>
                            </form>

                            <div class="tmpltr-wizard__confirmation" style="display: none;">
                                <div class="tmpltr-wizard__confirmation-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <h2>Check Your Email</h2>
                                <p>We've sent a confirmation link to your email. Please confirm your account to continue.</p>
                                <button type="button" class="button button-primary button-hero tmpltr-wizard__confirmed-btn">I've Confirmed My Email</button>
                                <button type="button" class="button button-secondary tmpltr-wizard__resend-btn">Resend Email</button>
                            </div>
                        </div>

                        <!-- Login Panel -->
                        <div class="tmpltr-wizard__auth-panel" data-panel="login">
                            <form id="tmpltr-wizard-login-form" class="tmpltr-wizard__form">
                                <div class="tmpltr-wizard__form-group">
                                    <label for="wizard-login-email">Email</label>
                                    <input type="email" id="wizard-login-email" name="email" class="regular-text" required>
                                </div>
                                <div class="tmpltr-wizard__form-group">
                                    <label for="wizard-login-password">Password</label>
                                    <input type="password" id="wizard-login-password" name="password" class="regular-text" required>
                                </div>
                                <button type="submit" class="button button-primary button-hero">Sign In</button>
                            </form>
                        </div>
                    </div>

                    <div class="tmpltr-wizard__info-panel">
                        <h3>What You Get</h3>
                        <ul class="tmpltr-wizard__info-list">
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a32a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Free starter plan
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a32a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI generation credits included
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a32a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Starter template ready to use
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a32a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Create unlimited custom templates
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Step 3: Setup -->
        <div class="tmpltr-wizard__step" data-step="3">
            <div class="tmpltr-wizard__setup">
                <div class="tmpltr-wizard__setup-loading">
                    <div class="tmpltr-wizard__spinner"></div>
                    <h2>Setting Up Your Workspace</h2>
                    <p>Importing starter template...</p>
                </div>

                <div class="tmpltr-wizard__setup-error" style="display: none;">
                    <h2>Something Went Wrong</h2>
                    <p class="tmpltr-wizard__setup-error-message"></p>
                    <div class="tmpltr-wizard__actions">
                        <button type="button" class="button button-secondary tmpltr-wizard__setup-skip">Skip to Dashboard</button>
                        <button type="button" class="button button-primary tmpltr-wizard__setup-retry">Try Again</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Step 4: Generate -->
        <div class="tmpltr-wizard__step" data-step="4">
            <div class="tmpltr-wizard__generate">
                <h1>Generate Your First Page</h1>
                <p class="tmpltr-wizard__subtitle">Fill in the fields below to generate an AI-powered page from the starter template.</p>

                <form id="tmpltr-wizard-generate-form" class="tmpltr-wizard__generate-form">
                    <div class="tmpltr-wizard__generate-fields"></div>
                    <p class="tmpltr-wizard__credit-cost"></p>
                    <button type="submit" class="button button-primary button-hero tmpltr-wizard__generate-btn">Generate Page</button>
                </form>
            </div>
        </div>

        <!-- Step 5: Success -->
        <div class="tmpltr-wizard__step" data-step="5">
            <div class="tmpltr-wizard__success">
                <div class="tmpltr-wizard__success-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00a32a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h1>Your Page is Ready!</h1>
                <p class="tmpltr-wizard__subtitle">Your first AI-generated page has been created successfully.</p>

                <div class="tmpltr-wizard__page-actions">
                    <a href="#" class="button button-secondary button-hero tmpltr-wizard__view-btn" target="_blank">View Page</a>
                    <a href="#" class="button button-secondary button-hero tmpltr-wizard__edit-btn" target="_blank">Edit Page</a>
                </div>

                <div class="tmpltr-wizard__checklist">
                    <h3>Next Steps</h3>
                    <ul class="tmpltr-wizard__checklist-list">
                        <li class="tmpltr-wizard__checklist-item tmpltr-wizard__checklist-item--done">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#00a32a" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 9 10.5 14.5 8 12"></polyline></svg>
                            Import Starter Template
                        </li>
                        <li class="tmpltr-wizard__checklist-item tmpltr-wizard__checklist-item--done">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#00a32a" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 9 10.5 14.5 8 12"></polyline></svg>
                            Generate your first Page
                        </li>
                        <li class="tmpltr-wizard__checklist-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c3c4c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
                            Customize Template Layout Page
                        </li>
                        <li class="tmpltr-wizard__checklist-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c3c4c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
                            Generate 3 more pages
                        </li>
                    </ul>
                </div>

                <button type="button" class="button button-primary button-hero tmpltr-wizard__dashboard-btn">Go to Dashboard</button>
            </div>
        </div>
    </div>
</div>
