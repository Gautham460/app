import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _stats;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final response = await ApiService.get('/analytics/admin/org-trends');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _stats = data['data'];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Admin fetch error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);

    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Colors.indigoAccent),
            SizedBox(height: 16),
            Text('Loading Enterprise Intelligence...', style: TextStyle(color: Colors.white70)),
          ],
        ),
      );
    }

    final moodTrends = _stats?['moodTrends'] as Map<String, dynamic>? ?? {};
    final totalMembers = _stats?['totalMembers'] ?? 0;
    final totalLogs = _stats?['totalLogs'] ?? 0;
    final burnoutAlerts = _stats?['burnoutAlerts'] ?? 0;

    final orgName = auth.user?.name != null ? '${auth.user!.name}\'s Org' : 'Your Team';

    // Chart data
    final moodColors = {
      'Happy': const Color(0xFF10b981),
      'Calm': const Color(0xFF3b82f6),
      'Stressed': const Color(0xFFef4444),
      'Neutral': const Color(0xFFa78bfa),
    };

    final stressedCount = (moodTrends['Stressed'] ?? 0) as num;
    final happyCount = (moodTrends['Happy'] ?? 0) as num;
    final isHighStress = stressedCount > happyCount;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.admin_panel_settings, color: Colors.indigoAccent, size: 32),
                      SizedBox(width: 8),
                      Text('Organization Intelligence',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text('Anonymized wellness oversight for $orgName.',
                      style: const TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Export feature coming soon!'))),
                icon: const Icon(Icons.download, size: 16),
                label: const Text('Export'),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Stats Row
          Row(
            children: [
              _buildStatCard('Active Members', '$totalMembers', Icons.people_outline, Colors.indigoAccent),
              const SizedBox(width: 12),
              _buildStatCard('Total Logs (7d)', '$totalLogs', Icons.notes, Colors.tealAccent),
              const SizedBox(width: 12),
              _buildStatCard('Burnout Alerts', '$burnoutAlerts',
                  Icons.warning_amber_rounded,
                  (burnoutAlerts as num) > 0 ? Colors.redAccent : Colors.greenAccent),
            ],
          ),
          const SizedBox(height: 32),

          // Pie Chart: Organizational Mood Pulse
          if (moodTrends.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Organizational Mood Pulse',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 220,
                    child: PieChart(
                      PieChartData(
                        sections: moodTrends.entries.map((entry) {
                          final color = moodColors[entry.key] ?? Colors.grey;
                          final value = (entry.value as num).toDouble();
                          return PieChartSectionData(
                            value: value,
                            color: color,
                            title: entry.key,
                            radius: 80,
                            titleStyle: const TextStyle(
                                fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                          );
                        }).toList(),
                        sectionsSpace: 4,
                        centerSpaceRadius: 40,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 16,
                    runSpacing: 8,
                    children: moodTrends.entries.map((entry) {
                      final color = moodColors[entry.key] ?? Colors.grey;
                      return Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                              width: 12, height: 12,
                              decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                          const SizedBox(width: 6),
                          Text('${entry.key}: ${entry.value}',
                              style: const TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      );
                    }).toList(),
                  )
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // AI Insight
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Organizational Insights',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                if (isHighStress) ...[
                  const Text('⚠️ High Stress Detected',
                      style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text(
                      'Current data suggests a stress peak across the team. Schedule a 15-minute guided meditation session before the weekly standup to lower cortisol levels.',
                      style: TextStyle(color: Colors.white70, height: 1.6)),
                ] else ...[
                  const Text('✅ Positive Momentum',
                      style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text(
                      'The team energy is currently Peak. This is an excellent time for complex architectural discussions or high-focus creative work.',
                      style: TextStyle(color: Colors.white70, height: 1.6)),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white38),
                        padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Auto-reminders feature coming soon!'))),
                    child: const Text('Configure Auto-Reminders',
                        style: TextStyle(color: Colors.white70)),
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    final hasBurnout = label == 'Burnout Alerts' && (int.tryParse(value) ?? 0) > 0;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
          border: hasBurnout ? Border.all(color: Colors.redAccent, width: 2) : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 12),
            Text(value,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(label,
                style: const TextStyle(fontSize: 11, color: Colors.white54)),
          ],
        ),
      ),
    );
  }
}
