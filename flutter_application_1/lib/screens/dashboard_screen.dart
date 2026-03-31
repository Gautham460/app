import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/energy_service.dart';
import '../widgets/energy_chart.dart';
import 'coach_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  
  static const List<Widget> _pages = [
    _MainDashboard(),
    CoachScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        selectedItemColor: Colors.indigoAccent,
        unselectedItemColor: Colors.white38,
        backgroundColor: const Color(0xFF1E293B),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble), label: 'AI Coach'),
        ],
      ),
    );
  }
}

class _MainDashboard extends StatefulWidget {
  const _MainDashboard();

  @override
  State<_MainDashboard> createState() => _MainDashboardState();
}

class _MainDashboardState extends State<_MainDashboard> {
  double _currentLevel = 5.0;
  String _selectedEmoji = 'Neutral';
  List<dynamic> _logs = [];
  bool _isLogging = false;

  final Map<String, String> _emojis = {
    'Happy': '😊',
    'Calm': '😌',
    'Stressed': '😫',
    'Neutral': '😐',
  };

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final logs = await EnergyService.fetchLogs(auth.user!.id, 'token_placeholder');
    setState(() {
      _logs = logs;
    });
  }

  Future<void> _handleLog() async {
    setState(() => _isLogging = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await EnergyService.logEnergy(
      auth.user!.id,
      'token_placeholder',
      _currentLevel.round(),
      _selectedEmoji,
    );
    if (success) {
      _fetchLogs();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Energy Logged!'), backgroundColor: Colors.green),
      );
    }
    setState(() => _isLogging = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Energy OS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.logout(),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, ${auth.user?.name ?? "User"}',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            
            // Energy Chart
            const Text('Energy Trends', style: TextStyle(fontSize: 16, color: Colors.white70)),
            const SizedBox(height: 8),
            Container(
              height: 150,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: EnergyChart(logs: _logs),
            ),
            const SizedBox(height: 24),

            // Energy Slider Card
            Card(
              color: const Color(0xFF1E293B),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Text('Track Your Energy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 20),
                    Text('${_currentLevel.round()}', style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Colors.indigoAccent)),
                    Slider(
                      value: _currentLevel,
                      min: 1,
                      max: 10,
                      divisions: 9,
                      activeColor: Colors.indigoAccent,
                      onChanged: (val) => setState(() => _currentLevel = val),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: _emojis.entries.map((e) {
                        return GestureDetector(
                          onTap: () => setState(() => _selectedEmoji = e.key),
                          child: Column(
                            children: [
                              Opacity(
                                opacity: _selectedEmoji == e.key ? 1.0 : 0.4,
                                child: Text(e.value, style: const TextStyle(fontSize: 32)),
                              ),
                              const SizedBox(height: 4),
                              Text(e.key, style: TextStyle(fontSize: 10, color: _selectedEmoji == e.key ? Colors.white : Colors.white38)),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _isLogging ? null : _handleLog,
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 50),
                        backgroundColor: Colors.indigoAccent,
                      ),
                      child: _isLogging ? const CircularProgressIndicator() : const Text('SUBMIT LOG', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
