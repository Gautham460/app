import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/fitbit_provider.dart';
import '../theme/app_theme.dart';

class MindfulnessScreen extends StatefulWidget {
  const MindfulnessScreen({super.key});

  @override
  State<MindfulnessScreen> createState() => _MindfulnessScreenState();
}

class _MindfulnessScreenState extends State<MindfulnessScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  
  bool _isActive = false;
  String _currentPhase = 'Ready';
  int _timeLeft = 0;
  Timer? _countdownTimer;

  // 4-7-8 Breathing technique
  final int _inhale = 4;
  final int _hold = 7;
  final int _exhale = 8;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
    _scaleAnimation = Tween<double>(begin: 1.0, end: 2.5).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut)
    );
  }

  void _runPhase(String phase, int seconds, double targetScale, VoidCallback onComplete) {
    if (!mounted) return;
    setState(() {
      _currentPhase = phase;
      _timeLeft = seconds;
    });

    _controller.animateTo(targetScale, duration: Duration(seconds: seconds));

    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return timer.cancel();
      if (_timeLeft > 1) {
        setState(() => _timeLeft--);
      } else {
        timer.cancel();
        onComplete();
      }
    });
  }

  void _startExercise() {
    setState(() => _isActive = true);
    _cycleBreathing();
  }

  void _cycleBreathing() {
    if (!_isActive) return;
    // Inhale
    _runPhase('Inhale', _inhale, 1.0, () {
      if (!_isActive) return;
      // Hold
      _runPhase('Hold', _hold, 1.0, () {
        if (!_isActive) return;
        // Exhale
        _runPhase('Exhale', _exhale, 0.0, () {
          if (!_isActive) return;
          _cycleBreathing(); // Loop
        });
      });
    });
  }

  void _stopExercise() {
    _countdownTimer?.cancel();
    _controller.animateTo(0.0, duration: const Duration(milliseconds: 500));
    setState(() {
      _isActive = false;
      _currentPhase = 'Ready';
      _timeLeft = 0;
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fitbit = Provider.of<FitbitProvider>(context);

    return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.self_improvement_rounded, color: Colors.tealAccent, size: 32),
                const SizedBox(width: 8),
                Text('Mindfulness Center', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 24)),
              ],
            ),
            const SizedBox(height: 8),
            const Text('Regulate your nervous system with 4-7-8 guided breathing.',
                textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
            const SizedBox(height: 48),

          if (fitbit.currentBpm > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.redAccent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20)
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.favorite, color: Colors.redAccent, size: 16),
                  const SizedBox(width: 8),
                  Text('Live BPM: ${fitbit.currentBpm}', style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          
          const SizedBox(height: 48),

          // Breathing Animation Circle
          SizedBox(
            height: 300,
            width: 300,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedBuilder(
                  animation: _scaleAnimation,
                  builder: (context, child) {
                    return Container(
                      width: 100 * _scaleAnimation.value,
                      height: 100 * _scaleAnimation.value,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.tealAccent.withOpacity(0.2),
                        border: Border.all(color: Colors.tealAccent.withOpacity(0.5), width: 2),
                      ),
                    );
                  },
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_currentPhase, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.tealAccent)),
                    if (_isActive)
                      Text('$_timeLeft s', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900)),
                  ],
                )
              ],
            ),
          ),

          const SizedBox(height: 48),

            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: _isActive
                    ? const LinearGradient(colors: [Colors.redAccent, Colors.red])
                    : const LinearGradient(colors: [Colors.tealAccent, Colors.teal]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                  ),
                  onPressed: _isActive ? _stopExercise : _startExercise,
                  child: Text(_isActive ? 'END SESSION' : 'START EXERCISE',
                      style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 16))),
            )
        ],
      )
    );
  }
}
