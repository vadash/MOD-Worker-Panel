export async function renderLoginPage() {
    const loginPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login</title>
        <style>
            :root {
                --primary-color: #4285F4;
                --background-color: #f8f9fa;
                --form-background-color: #ffffff;
                --border-color: #ddd;
                --input-background-color: white;
                --text-color: #333;
                --button-hover-color: #357ABD;
            }
            html, body {
                height: 100%;
                margin: 0;
                font-family: Arial, sans-serif;
                background-color: var(--background-color);
            }
            .container {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
            }
            .form-container {
                background: var(--form-background-color);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                padding: 24px;
                width: 100%;
                max-width: 320px;
                text-align: center;
            }
            .form-container h2 {
                color: var(--text-color);
                margin-bottom: 20px;
                font-size: 24px;
                font-weight: normal;
            }
            .form-control {
                margin-bottom: 16px;
            }
            input[type="password"] {
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                font-size: 14px;
                background-color: var(--input-background-color);
                color: var(--text-color);
                box-sizing: border-box; /* Include padding and border in the element's total width */
            }
            button {
                width: 100%;
                padding: 10px;
                font-size: 16px;
                font-weight: 600;
                border: none;
                border-radius: 4px;
                color: white;
                background-color: var(--primary-color);
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            button:hover {
                background-color: var(--button-hover-color);
            }
            #passwordError {
                color: red;
                margin-bottom: 10px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="form-container">
                <h2>Login</h2>
                <form id="loginForm">
                    <div class="form-control">
                        <input type="password" id="password" name="password" placeholder="Enter your password" required>
                    </div>
                    <div id="passwordError"></div>
                    <button type="submit">Sign in</button>
                </form>
            </div>
        </div>
        <script>
            document.getElementById('loginForm').addEventListener('submit', async (event) => {
                event.preventDefault();
                const password = document.getElementById('password').value;
                const passwordError = document.getElementById('passwordError');

                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain'
                        },
                        body: password
                    });

                    if (!response.ok) {
                        passwordError.textContent = 'Incorrect password. Please try again.';
                        const errorMessage = await response.text();
                        console.error('Login failed:', errorMessage);
                        return;
                    }
                    window.location.href = '/panel';
                } catch (error) {
                    console.error('Error during login:', error);
                }
            });
        </script>
    </body>
    </html>
    `;

    return new Response(loginPage, {
        status: 200,
        headers: {
            'Content-Type': 'text/html;charset=utf-8',
            'Access-Control-Allow-Origin': globalThis.urlOrigin,
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, no-transform',
            'CDN-Cache-Control': 'no-store'
        }
    });
}