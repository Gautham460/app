import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class SocialReportScreen extends StatefulWidget {
  const SocialReportScreen({super.key});

  @override
  State<SocialReportScreen> createState() => _SocialReportScreenState();
}

class _SocialReportScreenState extends State<SocialReportScreen> {
  bool _isLoading = true;
  List<dynamic> _logs = [];
  String _insight = '';
  int _burnoutRisk = 0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) return;
    final userId = auth.user!.id;

    try {
      final logsRes = await ApiService.get('/energy/$userId');
      final reportRes = await ApiService.get('/ai/report/$userId');

      if (logsRes.statusCode == 200) {
        final logs = jsonDecode(logsRes.body) as List;
        setState(() {
          _logs = logs;
          if (logs.isNotEmpty) {
            final level = logs[0]['energyLevel'] ?? logs[0]['level'] ?? 7;
            _burnoutRisk = level < 4 ? 85 : level < 7 ? 45 : 12;
          }
        });
      }
      if (reportRes.statusCode == 200) {
        final reportData = jsonDecode(reportRes.body);
        setState(() => _insight = reportData['report'] ?? '');
      }
    } catch (e) {
      debugPrint('Social report fetch error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final avgEnergy = _logs.isNotEmpty
        ? (_logs
                .map((l) => (l['energyLevel'] ?? l['level'] ?? 0) as num)
                .reduce((a, b) => a + b) /
            _logs.length)
            .toStringAsFixed(1)
        : '8.2';

    final topMood =
        _logs.isNotEmpty ? (_logs[0]['emotion'] ?? 'Focus') : 'Focus';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.bar_chart, color: Colors.purpleAccent, size: 32),
              SizedBox(width: 8),
              Text('Social Report',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
              'Generate and share your emotional energy week in review.',
              style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 32),

          // Report Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.purpleAccent.withOpacity(0.1),
                  Colors.pinkAccent.withOpacity(0.1),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border:
                  Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                const Icon(Icons.emoji_events,
                    color: Colors.purpleAccent, size: 64),
                const SizedBox(height: 12),
                const Text('Wellness AI Analysis',
                    style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),

                // Stats Row
                Row(
                  children: [
                    _statCard('Avg Energy', avgEnergy, Colors.indigoAccent),
                    const SizedBox(width: 12),
                    _statCard('Top Mood', topMood, Colors.greenAccent),
                    const SizedBox(width: 12),
                    _statCard('Burnout Risk', '$_burnoutRisk%',
                        _burnoutRisk > 50 ? Colors.redAccent : Colors.greenAccent),
                  ],
                ),
                const SizedBox(height: 24),

                // AI Insight
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: const Border(
                        left: BorderSide(color: Colors.purpleAccent, width: 4)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Deep AI Insight',
                          style: TextStyle(
                              color: Colors.purpleAccent,
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                      const SizedBox(height: 10),
                      Text(
                          _insight.isNotEmpty
                              ? _insight
                              : 'Log more energy data to get personalized AI insights.',
                          style: const TextStyle(
                              color: Colors.white70, height: 1.6)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Generated on ${DateTime.now().toString().substring(0, 10)}',
                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                ),
                const SizedBox(height: 24),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.purpleAccent,
                            padding: const EdgeInsets.symmetric(vertical: 14)),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                              content: Text('Share feature coming soon!')));
                        },
                        icon: const Icon(Icons.share, color: Colors.white),
                        label: const Text('Share',
                            style: TextStyle(color: Colors.white)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.white38),
                            padding: const EdgeInsets.symmetric(vertical: 14)),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                              content: Text('PDF export coming soon!')));
                        },
                        icon: const Icon(Icons.download, color: Colors.white70),
                        label: const Text('Export PDF',
                            style: TextStyle(color: Colors.white70)),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            Text(label.toUpperCase(),
                style:
                    const TextStyle(fontSize: 9, color: Colors.white54),
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(value,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: color),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
