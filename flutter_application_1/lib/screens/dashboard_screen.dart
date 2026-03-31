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
import '../theme/app_theme.dart';

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
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(_titles[_selectedIndex], style: AppTheme.darkTheme.textTheme.titleLarge),
        backgroundColor: AppTheme.background.withOpacity(0.8),
        elevation: 0,
        centerTitle: true,
        actions: [
          if (_selectedIndex == 0) // Only show logout on dashboard
            IconButton(
              icon: const Icon(Icons.logout, color: Colors.white70),
              onPressed: () => auth.logout(),
            )
        ],
      ),
      drawer: Drawer(
        backgroundColor: AppTheme.surface,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                gradient: AppTheme.primaryGradient,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.bolt, color: Colors.white, size: 32),
                  ),
                  const SizedBox(height: 12),
                  const Text('Emotional Energy OS', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  Text(auth.user?.name ?? 'User', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                ],
              ),
            ),
            _buildDrawerItem(Icons.dashboard_rounded, 0),
            _buildDrawerItem(Icons.chat_bubble_rounded, 1),
            _buildDrawerItem(Icons.check_circle_rounded, 2),
            _buildDrawerItem(Icons.bubble_chart_rounded, 3),
            _buildDrawerItem(Icons.show_chart_rounded, 4),
            _buildDrawerItem(Icons.self_improvement_rounded, 5),
            _buildDrawerItem(Icons.people_alt_rounded, 6),
            _buildDrawerItem(Icons.share_rounded, 7),
            _buildDrawerItem(Icons.admin_panel_settings_rounded, 8),
          ],
        ),
      ),
      body: _pages[_selectedIndex],
    );
  }

  Widget _buildDrawerItem(IconData icon, int index) {
    bool isSelected = _selectedIndex == index;
    return ListTile(
      leading: Icon(icon, color: isSelected ? AppTheme.primary : Colors.white60),
      title: Text(
        _titles[index],
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.white60,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: AppTheme.primary.withOpacity(0.1),
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
            style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 24),
          ),
          const SizedBox(height: 24),
            
          // Fitbit Live Sync
          Container(
            padding: const EdgeInsets.all(16),
            decoration: AppTheme.glassDecoration(opacity: 0.05, radius: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Fitbit Sync', style: TextStyle(fontSize: 14, color: Colors.white54)),
                    if (fitbit.currentBpm > 0)
                      Text('${fitbit.currentBpm} BPM',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.redAccent))
                    else
                      const Text('Disconnected', style: TextStyle(fontSize: 18, color: Colors.white70)),
                  ],
                ),
                if (fitbit.currentBpm == 0)
                  ElevatedButton(
                    onPressed: () async {
                      final url = Uri.parse('https://emotional-energy-os.onrender.com/api/fitbit/auth?userId=${auth.user!.id}');
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      } else {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Could not launch Fitbit login: $url')),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      backgroundColor: AppTheme.primary.withOpacity(0.2),
                    ),
                    child: const Text('Connect', style: TextStyle(color: AppTheme.primary)),
                  )
                else
                  const Icon(Icons.favorite, color: Colors.redAccent, size: 28),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Energy Chart
          const Text('Energy Trends', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            height: 180,
            padding: const EdgeInsets.all(16),
            decoration: AppTheme.glassDecoration(opacity: 0.03, radius: 24),
            child: EnergyChart(logs: _logs),
          ),
          const SizedBox(height: 32),

          // Energy Slider Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: AppTheme.darkGradient,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              children: [
                const Text('Log Current Energy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                Text('${_currentLevel.round()}',
                    style: const TextStyle(fontSize: 56, fontWeight: FontWeight.w900, color: AppTheme.primary)),
                Slider(
                  value: _currentLevel,
                  min: 1,
                  max: 10,
                  divisions: 9,
                  activeColor: AppTheme.primary,
                  inactiveColor: Colors.white10,
                  onChanged: (val) => setState(() => _currentLevel = val),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: _emojis.entries.map((e) {
                    bool isSelected = _selectedEmoji == e.key;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedEmoji = e.key),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primary.withOpacity(0.1) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          children: [
                            Text(e.value, style: TextStyle(fontSize: isSelected ? 36 : 28)),
                            const SizedBox(height: 4),
                            Text(e.key,
                                style: TextStyle(
                                    fontSize: 10,
                                    color: isSelected ? Colors.white : Colors.white38,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 32),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: ElevatedButton(
                    onPressed: _isLogging ? null : _handleLog,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                    ),
                    child: _isLogging
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('SAVE ENERGY LOG', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                  ),
                )
              ],
            ),
          ),
          ],
        ),
      );
  }
}
