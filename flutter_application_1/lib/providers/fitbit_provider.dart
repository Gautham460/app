import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class FitbitProvider extends ChangeNotifier {
  int currentBpm = 0;
  List<dynamic> logs = [];
  Timer? _pollingTimer;

  void startPolling(String userId) {
    _syncFitbit(userId);
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _syncFitbit(userId);
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> _syncFitbit(String userId) async {
    try {
      final response = await ApiService.get('/fitbit/heart-rate/$userId');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data != null && data['logs'] != null) {
          currentBpm = data['currentBpm'] ?? 0;
          logs = data['logs'];
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Fitbit sync error: $e');
    }
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
