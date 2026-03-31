import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/energy_service.dart';
import '../widgets/energy_chart.dart';
import 'coach_screen.dart';
import 'habit_link_screen.dart';
import 'mood_sphere_screen.dart';
import 'energy_forecast_screen.dart';
import 'mindfulness_screen.dart';
import 'community_screen.dart';
import 'social_report_screen.dart';
import 'admin_dashboard_screen.dart';
import '../providers/fitbit_provider.dart';
import 'package:url_launcher/url_launcher.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.user != null) {
        Provider.of<FitbitProvider>(context, listen: false).startPolling(auth.user!.id);
      }
    });
  }
  
  static const List<String> _titles = [
    'Energy Dashboard',
    'AI Coach',
    'Habit Link',
    'Mood Sphere',
    'Energy Forecast',
    'Mindfulness',
    'Community Feed',
    'Social Report',
    'Admin Portal',
  ];

  static const List<Widget> _pages = [
    _MainDashboard(),
    CoachScreen(),
    HabitLinkScreen(),
    MoodSphereScreen(),
    EnergyForecastScreen(),
    MindfulnessScreen(),
    CommunityScreen(),
    SocialReportScreen(),
    AdminDashboardScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        actions: [
          if (_selectedIndex == 0) // Only show logout on dashboard
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () => auth.logout(),
            )
        ],
      ),
      drawer: Drawer(
        backgroundColor: const Color(0xFF1E293B),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                color: Colors.indigoAccent,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Icon(Icons.energy_savings_leaf, color: Colors.white, size: 48),
                  const SizedBox(height: 12),
                  Text('Emotional Energy OS', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  Text(auth.user?.name ?? 'User', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                ],
              ),
            ),
            _buildDrawerItem(Icons.dashboard, 0),
            _buildDrawerItem(Icons.chat_bubble, 1),
            _buildDrawerItem(Icons.check_circle_outline, 2),
            _buildDrawerItem(Icons.bubble_chart, 3),
            _buildDrawerItem(Icons.show_chart, 4),
            _buildDrawerItem(Icons.self_improvement, 5),
            _buildDrawerItem(Icons.people_outline, 6),
            _buildDrawerItem(Icons.share, 7),
            _buildDrawerItem(Icons.admin_panel_settings, 8),
          ],
        ),
      ),
      body: _pages[_selectedIndex],
    );
  }

  Widget _buildDrawerItem(IconData icon, int index) {
    return ListTile(
      leading: Icon(icon, color: _selectedIndex == index ? Colors.indigoAccent : Colors.white70),
      title: Text(_titles[index], style: TextStyle(color: _selectedIndex == index ? Colors.white : Colors.white70)),
      onTap: () {
        setState(() => _selectedIndex = index);
        Navigator.pop(context); // Close drawer
      },
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
    final fitbit = Provider.of<FitbitProvider>(context);

    return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, ${auth.user?.name ?? "User"}',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            
            // Fitbit Live Sync
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Fitbit Heart Rate', style: TextStyle(fontSize: 16, color: Colors.white70)),
                if (fitbit.currentBpm > 0)
                  Text('${fitbit.currentBpm} BPM', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.redAccent)),
                if (fitbit.currentBpm == 0)
                  ElevatedButton(
                    onPressed: () async {
                      final url = Uri.parse('https://emotional-energy-os.onrender.com/api/fitbit/auth?userId=${auth.user!.id}');
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      }
                    },
                    child: const Text('Connect Fitbit'),
                  )
              ],
            ),
            const SizedBox(height: 16),

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
      );
  }
}
