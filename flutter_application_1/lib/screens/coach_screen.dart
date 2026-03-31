import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class CoachScreen extends StatefulWidget {
  const CoachScreen({super.key});

  @override
  State<CoachScreen> createState() => _CoachScreenState();
}

class _CoachScreenState extends State<CoachScreen> {
  final _messageController = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _isTyping = false;

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final userMessage = _messageController.text.trim();
    setState(() {
      _messages.add({'role': 'user', 'content': userMessage});
      _messageController.clear();
      _isTyping = true;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      final response = await ApiService.post('/coach/chat', {
        'userId': auth.user!.id,
        'message': userMessage,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _messages.add({'role': 'coach', 'content': data['reply'] ?? 'I am here to help!'});
        });
      }
    } catch (e) {
      print('Chat error: $e');
    }

    setState(() => _isTyping = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: _messages.length,
            itemBuilder: (ctx, i) {
              final m = _messages[i];
              final isUser = m['role'] == 'user';
              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Column(
                  crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                      decoration: BoxDecoration(
                        gradient: isUser ? AppTheme.primaryGradient : null,
                        color: isUser ? null : AppTheme.surface.withOpacity(0.5),
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft: Radius.circular(isUser ? 16 : 0),
                          bottomRight: Radius.circular(isUser ? 0 : 16),
                        ),
                        border: isUser ? null : Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Text(
                        m['content'] ?? '',
                        style: TextStyle(color: isUser ? Colors.white : Colors.white70, fontSize: 15),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isUser ? 'YOU' : 'AI COACH',
                      style: const TextStyle(fontSize: 9, color: Colors.white38, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              );
            },
          ),
        ),
        if (_isTyping)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                ),
                SizedBox(width: 8),
                Text('AI Coach is thinking...', style: TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  decoration: AppTheme.glassDecoration(opacity: 0.05, radius: 24),
                  child: TextField(
                    controller: _messageController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Type your message...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              CircleAvatar(
                backgroundColor: AppTheme.primary,
                child: IconButton(
                  icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                  onPressed: _sendMessage,
                ),
              )
            ],
          ),
        )
      ],
    );
  }
}
