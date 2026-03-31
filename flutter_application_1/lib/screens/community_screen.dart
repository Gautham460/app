import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  bool _isLoading = true;
  double _energyPulse = 7.5;
  int _communityBpm = 72;
  List<dynamic> _moods = [];
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchPulse();
    _pollingTimer = Timer.periodic(const Duration(minutes: 1), (_) => _fetchPulse());
  }

  Future<void> _fetchPulse() async {
    try {
      final response = await ApiService.get('/analytics/community-vibe');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            // Handle parsing safely since JS parseFloat might be needed
            _energyPulse = (data['averageEnergy'] is String) 
                ? double.tryParse(data['averageEnergy']) ?? 7.0 
                : (data['averageEnergy'] as num?)?.toDouble() ?? 7.0;
            _moods = data['moods'] ?? [];
            _communityBpm = 72; // Static from web implementation
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Failed to fetch community pulse: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Color _getColor(String mood) {
    switch (mood) {
      case 'Happy': return Colors.greenAccent;
      case 'Calm': return Colors.blueAccent;
      case 'Stressed': return Colors.redAccent;
      default: return Colors.purpleAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final maxCount = _moods.isNotEmpty 
        ? _moods.map((e) => (e['count'] as num).toInt()).reduce((a, b) => a > b ? a : b) 
        : 1;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.people_alt_rounded, color: Colors.orangeAccent, size: 32),
              const SizedBox(width: 12),
              Text('Community Vibe', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 24)),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Real-time anonymous global emotional energy state.', style: TextStyle(color: Colors.white54)),
          const SizedBox(height: 32),

          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: AppTheme.glassDecoration(opacity: 0.05, radius: 20).copyWith(
                    border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ENERGY AVG', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(_energyPulse.toStringAsFixed(1), style: const TextStyle(fontSize: 28, color: Colors.purpleAccent, fontWeight: FontWeight.w900)),
                          const Text(' / 10', style: TextStyle(fontSize: 14, color: Colors.purpleAccent)),
                        ],
                      )
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: AppTheme.glassDecoration(opacity: 0.05, radius: 20).copyWith(
                    border: Border.all(color: Colors.pinkAccent.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('GLOBAL BPM', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text('$_communityBpm', style: const TextStyle(fontSize: 28, color: Colors.pinkAccent, fontWeight: FontWeight.w900)),
                          const Text(' BPM', style: TextStyle(fontSize: 14, color: Colors.pinkAccent)),
                        ],
                      )
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),
          
          Container(
            padding: const EdgeInsets.all(24),
            decoration: AppTheme.glassDecoration(opacity: 0.03, radius: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Global Mood Distribution', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const Text('(Past 24h)', style: TextStyle(color: Colors.white54, fontSize: 12)),
                const SizedBox(height: 24),
                
                if (_moods.isEmpty)
                  const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No data logged recently.', style: TextStyle(color: Colors.white54))))
                else
                  SizedBox(
                    height: 200,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: _moods.map((m) {
                        final count = (m['count'] as num).toInt();
                        final id = m['_id'] ?? 'Unknown';
                        final color = _getColor(id);
                        final heightPercentage = count / maxCount;
                        
                        return Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text('$count', style: const TextStyle(color: Colors.white54, fontSize: 10)),
                            const SizedBox(height: 4),
                            Container(
                              width: 40,
                              height: 140 * heightPercentage,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [color.withOpacity(0.8), color.withOpacity(0.2)],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(id, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        );
                      }).toList(),
                    ),
                  )
              ],
            ),
          )
        ],
      )
    );
  }
}
