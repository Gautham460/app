import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  String? _token;
  bool _isLoading = false;

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.post('/auth/login', {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'];
        _user = UserModel.fromJson(data['user']);
        
        // Store token for persistence
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', _token!);
        
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Login error: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register(String username, String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.post('/auth/register', {
        'username': username,
        'email': email,
        'password': password,
      });

      if (response.statusCode == 201) {
        // Automatically login after successful registration or just return true.
        _isLoading = false;
        notifyListeners();
        // Since backend doesn't return the token in body (it sets a cookie), 
        // we should try to login directly to get the token or just return true.
        // Wait, backend register DOES return a token cookie, but flutter ApiService might not handle cookies.
        // Let's just return true and require the user to log in if needed.
        return true;
      }
    } catch (e) {
      print('Registration error: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    notifyListeners();
  }

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey('jwt_token')) return;

    _token = prefs.getString('jwt_token');
    
    try {
      final response = await ApiService.get('/auth/me', token: _token);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _user = UserModel.fromJson(data['user']);
        notifyListeners();
      } else {
        await logout();
      }
    } catch (e) {
      print('Auto-login error: $e');
      await logout();
    }
  }
}
