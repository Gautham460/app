import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

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
        _errorMessage = isLoginMode ? 'Invalid username or password' : 'Registration failed. User may already exist.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),
                const Icon(Icons.bolt, size: 80, color: Colors.indigoAccent),
                const SizedBox(height: 24),
                const Text(
                  'Emotional Energy OS',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isLoginMode ? 'Log in to sync your biometrics and mood.' : 'Create an account to start your journey.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 48),
                TextField(
                  controller: _usernameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Username',
                    labelStyle: const TextStyle(color: Colors.white70),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                if (!isLoginMode) ...[
                  const SizedBox(height: 16),
                  TextField(
                    controller: _emailController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Email',
                      labelStyle: const TextStyle(color: Colors.white70),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Password',
                    labelStyle: const TextStyle(color: Colors.white70),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.redAccent),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: Provider.of<AuthProvider>(context).isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.indigoAccent,
                    shape: RoundedRectangleAtMost(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Provider.of<AuthProvider>(context).isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(isLoginMode ? 'Login' : 'Register', style: const TextStyle(fontSize: 18, color: Colors.white)),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    setState(() {
                      isLoginMode = !isLoginMode;
                      _errorMessage = null; // Clear error on mode switch
                    });
                  },
                  child: Text(
                    isLoginMode ? 'Don\'t have an account? Register here' : 'Already have an account? Log in',
                    style: const TextStyle(color: Colors.indigoAccent),
                  ),
                ),
              ],
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
