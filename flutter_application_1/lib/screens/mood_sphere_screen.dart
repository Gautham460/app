import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../providers/auth_provider.dart';
import '../providers/fitbit_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class MoodSphereScreen extends StatefulWidget {
  const MoodSphereScreen({super.key});

  @override
  State<MoodSphereScreen> createState() => _MoodSphereScreenState();
}

class _MoodSphereScreenState extends State<MoodSphereScreen> with SingleTickerProviderStateMixin {
  late IO.Socket socket;
  late AnimationController _animationController;
  
  Map<String, int> clusters = {
    'Happy': 0,
    'Calm': 0,
    'Stressed': 0,
    'Neutral': 0,
  };

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
      
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchLogs();
      _initSocket();
    });
  }

  Future<void> _fetchLogs() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) return;

    try {
      final response = await ApiService.get('/energy/${auth.user!.id}');
      if (response.statusCode == 200) {
        final logs = jsonDecode(response.body) as List;
        final counts = {'Happy': 0, 'Calm': 0, 'Stressed': 0, 'Neutral': 0};
        
        for (var log in logs) {
          final emotion = log['emotion'] as String?;
          if (emotion != null && counts.containsKey(emotion)) {
            counts[emotion] = counts[emotion]! + 1;
          }
        }
        
        if (mounted) {
          setState(() {
            clusters = counts;
          });
        }
      }
    } catch (e) {
      debugPrint('Failed to fetch mood logs: $e');
    }
  }

  void _initSocket() {
    socket = IO.io(ApiService.baseUrl.replaceAll('/api', ''), <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.connect();

    socket.on('new_log', (data) {
      if (data != null && data['emotion'] != null) {
        final emotion = data['emotion'] as String;
        if (clusters.containsKey(emotion)) {
          if (mounted) {
            setState(() {
              clusters[emotion] = clusters[emotion]! + 1;
            });
          }
        }
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    socket.dispose();
    super.dispose();
  }

  Color _getColor(String mood) {
    switch (mood) {
      case 'Happy':
        return Colors.greenAccent;
      case 'Calm':
        return Colors.blueAccent;
      case 'Stressed':
        return Colors.redAccent;
      default:
        return Colors.purpleAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final fitbit = Provider.of<FitbitProvider>(context);
    final bpm = fitbit.currentBpm > 0 ? fitbit.currentBpm : 70;
    
    // Adjust animation speed based on BPM
    final durationSeconds = max(0.3, 60 / bpm);
    _animationController.duration = Duration(milliseconds: (durationSeconds * 1000).toInt());

    final activeMoods = clusters.entries.where((e) => e.value > 0).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bubble_chart_rounded, color: AppTheme.primary, size: 32),
              const SizedBox(width: 8),
              Text(
                'Neural Sphere 2.0',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Real-time generative biometric visualization.', style: TextStyle(color: Colors.white54)),
          const SizedBox(height: 32),

          // Central Visualization Container
          Container(
            height: 400,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: const RadialGradient(
                colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                radius: 0.8,
              ),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: Colors.white10),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Live BPM Indicator
                Positioned(
                  top: 20,
                  left: 20,
                  child: Row(
                    children: [
                      const Icon(Icons.favorite, color: Colors.redAccent, size: 16),
                      const SizedBox(width: 4),
                      Text('$bpm BPM SYNCED', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70)),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 20,
                  right: 20,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12)
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.bolt, color: Colors.greenAccent, size: 16),
                        SizedBox(width: 4),
                        Text('2D ENGINE ACTIVE', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12))
                      ],
                    ),
                  )
                ),

                // Generative Graphics
                AnimatedBuilder(
                  animation: _animationController,
                  builder: (context, child) {
                    return CustomPaint(
                      size: const Size(300, 300),
                      painter: _SpherePainter(
                        animationValue: _animationController.value,
                        activeMoods: activeMoods,
                        getColor: _getColor,
                      ),
                    );
                  },
                )
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Data Cards
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 2.2,
            children: clusters.entries.map((entry) {
              final color = _getColor(entry.key);
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: AppTheme.glassDecoration(opacity: 0.05, radius: 20).copyWith(
                  border: Border.all(color: color.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(entry.key.toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.white54, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                    const SizedBox(height: 4),
                    Text('${entry.value}', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
                  ],
                ),
              );
            }).toList(),
          )
        ],
      ),
    );
  }
}

class _SpherePainter extends CustomPainter {
  final double animationValue;
  final List<MapEntry<String, int>> activeMoods;
  final Color Function(String) getColor;

  _SpherePainter({
    required this.animationValue,
    required this.activeMoods,
    required this.getColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    // Central Pulse Ring
    final ringPaint = Paint()
      ..color = Colors.indigoAccent.withOpacity(0.1 + (animationValue * 0.2))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1 + (animationValue * 3);
    
    canvas.drawCircle(center, 80 + (animationValue * 30), ringPaint);

    if (activeMoods.isEmpty) {
      final defaultPaint = Paint()
        ..shader = RadialGradient(
          colors: [getColor('Neutral').withOpacity(0.8), Colors.transparent],
        ).createShader(Rect.fromCircle(center: center, radius: 40));
      canvas.drawCircle(center, 40, defaultPaint);
      return;
    }

    // Draw Orbs
    for (int i = 0; i < activeMoods.length; i++) {
      final mood = activeMoods[i];
      final angle = (i / activeMoods.length) * pi * 2;
      
      // Floating offset based on animation
      final floatOffset = sin(angle + (animationValue * pi * 2)) * 10;
      
      final radius = 100.0;
      final x = center.dx + cos(angle) * radius;
      final y = center.dy + sin(angle) * radius + floatOffset;
      
      final orbSize = 25.0 + (mood.value * 2) + (animationValue * 5);

      final color = getColor(mood.key);
      final orbPaint = Paint()
        ..shader = RadialGradient(
          colors: [color.withOpacity(0.9), color.withOpacity(0.0)],
        ).createShader(Rect.fromCircle(center: Offset(x, y), radius: orbSize))
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);

      canvas.drawCircle(Offset(x, y), orbSize, orbPaint);

      // Label
      final textPainter = TextPainter(
        text: TextSpan(text: mood.key.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(x - (textPainter.width / 2), y - (textPainter.height / 2)));
    }
  }

  @override
  bool shouldRepaint(covariant _SpherePainter oldDelegate) {
    return oldDelegate.animationValue != animationValue || 
           oldDelegate.activeMoods.length != activeMoods.length;
  }
}
