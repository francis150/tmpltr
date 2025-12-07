<?php
/**
 * Login Page
 *
 * @package Tmpltr
 */

defined('ABSPATH') or die();
?>

<div class="tmpltr-auth-page tmpltr-admin-page">
        <h1>Login to Tmpltr</h1>

        <div class="tmpltr-auth-form-wrapper">
        <form id="tmpltr-login-form" class="tmpltr-auth-form">
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="auth-email">Email</label></th>
                    <td><input type="email" id="auth-email" name="email" class="regular-text" required></td>
                </tr>
                <tr>
                    <th scope="row"><label for="auth-password">Password</label></th>
                    <td><input type="password" id="auth-password" name="password" class="regular-text" required></td>
                </tr>
            </table>

            <p class="submit">
                <button type="submit" class="button button-primary">Sign In</button>
            </p>
        </form>

        <p>Don't have an account? <a href="<?php echo esc_url(admin_url('admin.php?page=tmpltr-register')); ?>">Register here</a></p>
        </div>
    </div>