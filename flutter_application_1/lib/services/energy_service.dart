import 'dart:convert';
import '../services/api_service.dart';

class EnergyService {
  static Future<List<dynamic>> fetchLogs(String userId, String token) async {
    final response = await ApiService.get('/energy/$userId', token: token);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<bool> logEnergy(String userId, String token, int level, String emotion) async {
    final response = await ApiService.post('/energy/log', {
      'userId': userId,
      'level': level,
      'emotion': emotion,
    }, token: token);
    return response.statusCode == 201;
  }
}
