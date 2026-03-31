import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class HabitLinkScreen extends StatefulWidget {
  const HabitLinkScreen({super.key});

  @override
  State<HabitLinkScreen> createState() => _HabitLinkScreenState();
}

class _HabitLinkScreenState extends State<HabitLinkScreen> {
  List<dynamic> _habits = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchHabits();
  }

  Future<void> _fetchHabits() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) return;
    
    try {
      final response = await ApiService.get('/habit/${auth.user!.id}');
      if (response.statusCode == 200) {
        setState(() {
          _habits = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching habits: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _addHabit(String name) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      final response = await ApiService.post('/habit/add', {
        'userId': auth.user!.id,
        'name': name,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        setState(() {
          _habits.add(jsonDecode(response.body));
        });
      }
    } catch (e) {
      debugPrint('Error adding habit: $e');
    }
  }

  Future<void> _logHabit(String habitId) async {
    try {
      final response = await ApiService.post('/habit/log', {
        'habitId': habitId,
        'value': 1,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        final updatedHabit = jsonDecode(response.body);
        setState(() {
          final index = _habits.indexWhere((h) => h['_id'] == habitId);
          if (index != -1) {
            _habits[index] = updatedHabit;
          }
        });
      }
    } catch (e) {
      debugPrint('Error logging habit: $e');
    }
  }

  void _showAddHabitDialog() {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('New Habit Tracker'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'e.g. Meditation, Running'),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                _addHabit(controller.text.trim());
              }
              Navigator.pop(ctx);
            },
            child: const Text('Add Tracker'),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _habits.length + 1,
            itemBuilder: (ctx, i) {
              if (i == _habits.length) {
                return Padding(
                  padding: const EdgeInsets.only(top: 16.0),
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(20),
                      backgroundColor: Colors.white.withOpacity(0.05),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Colors.white38, style: BorderStyle.solid),
                      )
                    ),
                    onPressed: _showAddHabitDialog, 
                    icon: const Icon(Icons.add), 
                    label: const Text('Add New Habit Tracker')
                  ),
                );
              }

              final habit = _habits[i];
              final logsCount = (habit['logs'] as List?)?.length ?? 0;
              final impact = logsCount * 5;

              return Card(
                color: const Color(0xFF1E293B),
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.tealAccent.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12)
                        ),
                        child: const Icon(Icons.self_improvement, color: Colors.tealAccent),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(habit['name'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            Text('Logs: $logsCount', style: const TextStyle(color: Colors.white54)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('+$impact%', style: const TextStyle(color: Colors.greenAccent, fontSize: 20, fontWeight: FontWeight.bold)),
                          const Text('Est. Impact', style: TextStyle(fontSize: 10, color: Colors.white54)),
                        ],
                      ),
                      const SizedBox(width: 16),
                      IconButton(
                        onPressed: () => _logHabit(habit['_id']),
                        icon: const Icon(Icons.check_circle_outline, color: Colors.tealAccent, size: 32),
                      )
                    ],
                  ),
                ),
              );
            },
          );
  }
}
