import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() {
    return 'ApiException ($statusCode): $message';
  }
}

class ApiService {
  static const String baseUrl = 'https://emotional-energy-os.onrender.com/api';

  static Map<String, String> _getHeaders([String? token]) {
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<http.Response> get(String endpoint, {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(token),
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(500, 'Network error: ${e.toString()}');
    }
  }

  static Future<http.Response> post(String endpoint, Map<String, dynamic> body, {String? token}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(token),
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(500, 'Network error: ${e.toString()}');
    }
  }

  static http.Response _handleResponse(http.Response response) {
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
    return response;
  }
}
