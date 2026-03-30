import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class EnergyChart extends StatelessWidget {
  final List<dynamic> logs;

  const EnergyChart({super.key, required this.logs});

  @override
  Widget build(BuildContext context) {
    if (logs.isEmpty) {
      return const Center(child: Text('No data yet', style: TextStyle(color: Colors.white38)));
    }

    // Convert logs to FlSpot
    final spots = logs.asMap().entries.map((e) {
      final val = e.value['level'] is int ? (e.value['level'] as int).toDouble() : 5.0;
      return FlSpot(e.key.toDouble(), val);
    }).toList().reversed.toList();

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        minX: 0,
        maxX: spots.length.toDouble() - 1,
        minY: 0,
        maxY: 10,
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: Colors.indigoAccent,
            barWidth: 4,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: Colors.indigoAccent.withOpacity(0.1),
            ),
          ),
        ],
      ),
    );
  }
}
