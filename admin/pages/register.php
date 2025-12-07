<?php
/**
 * Register Page
 *
 * @package Tmpltr
 */

defined('ABSPATH') or die();
?>

<div class="tmpltr-admin-page tmpltr-auth-page">
        <h1>Create Account</h1>

        <div class="tmpltr-auth-form-wrapper">
        <form id="tmpltr-register-form" class="tmpltr-auth-form">
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="auth-email">Email</label></th>
                    <td><input type="email" id="auth-email" name="email" class="regular-text" required></td>
                </tr>
                <tr>
                    <th scope="row"><label for="auth-password">Password</label></th>
                    <td><input type="password" id="auth-password" name="password" class="regular-text" required></td>
                </tr>
                <tr>
                    <th scope="row"><label for="auth-password-confirm">Confirm Password</label></th>
                    <td><input type="password" id="auth-password-confirm" name="password_confirm" class="regular-text" required></td>
                </tr>
            </table>

            <p class="submit">
                <button type="submit" class="button button-primary">Create Account</button>
            </p>
        </form>

        <p>Already have an account? <a href="<?php echo esc_url(admin_url('admin.php?page=tmpltr-login')); ?>">Sign in here</a></p>
        </div>
    </div>