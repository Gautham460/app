import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _errorMessage;
  bool isLoginMode = true;

  Future<void> _handleSubmit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    bool success = false;

    if (isLoginMode) {
      success = await auth.login(
        _usernameController.text,
        _passwordController.text,
      );
    } else {
      success = await auth.register(
        _usernameController.text,
        _emailController.text,
        _passwordController.text,
      );
      if (success) {
        // Automatically login after successful registration or show success message.
        success = await auth.login(
          _usernameController.text,
          _passwordController.text,
        );
      }
    }

    if (!success) {
      setState(() {
        _errorMessage = auth.apiError ?? (isLoginMode ? 'Invalid username or password' : 'Registration failed.');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: AppTheme.darkGradient,
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Container(
                padding: const EdgeInsets.all(28.0),
                decoration: AppTheme.glassDecoration(opacity: 0.05, radius: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(Icons.bolt, size: 70, color: AppTheme.primary),
                    const SizedBox(height: 20),
                    Text(
                      'Emotional Energy OS',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isLoginMode ? 'Log in to sync your biometrics and mood.' : 'Create an account to start your journey.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white54, fontSize: 14),
                    ),
                    const SizedBox(height: 40),
                    TextField(
                      controller: _usernameController,
                      decoration: const InputDecoration(labelText: 'Username'),
                    ),
                    if (!isLoginMode) ...[
                      const SizedBox(height: 16),
                      TextField(
                        controller: _emailController,
                        decoration: const InputDecoration(labelText: 'Email'),
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Password'),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 20),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    const SizedBox(height: 32),
                    Container(
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withOpacity(0.3),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: Provider.of<AuthProvider>(context).isLoading ? null : _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: Provider.of<AuthProvider>(context).isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(isLoginMode ? 'Login' : 'Register', style: const TextStyle(fontSize: 18, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          isLoginMode = !isLoginMode;
                          _errorMessage = null; // Clear error on mode switch
                        });
                      },
                      child: Text(
                        isLoginMode ? 'Don\'t have an account? Register here' : 'Already have an account? Log in',
                        style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Helper for consistency
class RoundedRectangleAtMost extends RoundedRectangleBorder {
  RoundedRectangleAtMost({required BorderRadiusGeometry borderRadius}) : super(borderRadius: borderRadius);
}
