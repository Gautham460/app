import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class EnergyForecastScreen extends StatefulWidget {
  const EnergyForecastScreen({super.key});

  @override
  State<EnergyForecastScreen> createState() => _EnergyForecastScreenState();
}

class _EnergyForecastScreenState extends State<EnergyForecastScreen> {
  bool _isLoading = true;
  List<dynamic> _historical = [];
  List<dynamic> _future = [];

  @override
  void initState() {
    super.initState();
    _fetchForecast();
  }

  Future<void> _fetchForecast() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.user == null) return;

    try {
      final response = await ApiService.get('/energy/forecast/${auth.user!.id}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _historical = data['historicalData'] ?? [];
          _future = data['futureData'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Forecast error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_historical.isEmpty && _future.isEmpty) {
      return const Center(child: Text('Not enough data for AI forecasting. Keep logging!'));
    }

    final List<FlSpot> histSpots = [];
    final List<FlSpot> futSpots = [];

    // Map historical logs to graph spots (x = index, y = level)
    for (int i = 0; i < _historical.length; i++) {
        num level = _historical[i]['level'] ?? 0;
        histSpots.add(FlSpot(i.toDouble(), level.toDouble()));
    }
    
    // Future starts where historical ended
    int offset = _historical.length;
    for (int i = 0; i < _future.length; i++) {
        num pred = _future[i]['predictedLevel'] ?? 0;
        futSpots.add(FlSpot((offset + i).toDouble(), pred.toDouble()));
    }

    final double maxX = (histSpots.length + futSpots.length).toDouble();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.show_chart, color: Colors.indigoAccent, size: 32),
              const SizedBox(width: 8),
              const Text('Predictive AI Forecasting', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Your emotional energy trajectory for the next 7 days based on deep biometrics.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 32),

          Container(
            height: 300,
            padding: const EdgeInsets.only(right: 20, top: 20, bottom: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: 10,
                minX: 0,
                maxX: maxX > 0 ? maxX - 1 : 0,
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                     sideTitles: SideTitles(
                       showTitles: true, 
                       getTitlesWidget: (v, m) => Text(v.toInt().toString(), style: const TextStyle(color: Colors.white38, fontSize: 10)),
                       reservedSize: 30,
                     )
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: histSpots,
                    isCurved: true,
                    color: Colors.blueAccent,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: Colors.blueAccent.withOpacity(0.1),
                    ),
                  ),
                  LineChartBarData(
                    spots: futSpots.isNotEmpty ? [histSpots.last, ...futSpots] : futSpots,
                    isCurved: true,
                    color: Colors.purpleAccent,
                    barWidth: 3,
                    dashArray: [5, 5],
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      color: Colors.purpleAccent.withOpacity(0.1),
                    ),
                  )
                ],
              ),
            ),
          ),

          const SizedBox(height: 32),
          // Breakdown cards
          Row(
            children: [
              Expanded(
                child: Container(
                   padding: const EdgeInsets.all(20),
                   decoration: BoxDecoration(color: Colors.blueAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                   child: Column(
                     children: [
                       const Text('Recent Average', style: TextStyle(color: Colors.white54)),
                       const SizedBox(height: 8),
                       Text(
                         histSpots.isNotEmpty 
                          ? (histSpots.map((s) => s.y).reduce((a, b) => a + b) / histSpots.length).toStringAsFixed(1) 
                          : '0.0', 
                         style: const TextStyle(fontSize: 28, color: Colors.blueAccent, fontWeight: FontWeight.bold)
                       )
                     ],
                   )
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                   padding: const EdgeInsets.all(20),
                   decoration: BoxDecoration(color: Colors.purpleAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                   child: Column(
                     children: [
                       const Text('Forecasted Average', style: TextStyle(color: Colors.white54)),
                       const SizedBox(height: 8),
                       Text(
                         futSpots.isNotEmpty 
                          ? (futSpots.map((s) => s.y).reduce((a, b) => a + b) / futSpots.length).toStringAsFixed(1) 
                          : '0.0', 
                         style: const TextStyle(fontSize: 28, color: Colors.purpleAccent, fontWeight: FontWeight.bold)
                       )
                     ],
                   )
                ),
              )
            ],
          )
        ],
      )
    );
  }
}
