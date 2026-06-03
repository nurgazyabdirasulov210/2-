import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: TravelScreen()));
}

class TravelScreen extends StatefulWidget {
  const TravelScreen({super.key});

  @override
  State<TravelScreen> createState() => _TravelScreenState();
}

class _TravelScreenState extends State<TravelScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String selectedCountry = 'Кыргызстан';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  List<String> categories = ['Пляжи', 'Горы', 'Леса', 'Музеи', 'Парки', 'Отели'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 200,
            child: Stack(
              children: [
                Image.network(
                  'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
                const Center(
                  child: Text("Путешествия", 
                      style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          TabBar(
            controller: _tabController,
            labelColor: Colors.blue,
            tabs: const [
              Tab(text: "Популярное"),
              Tab(text: "Горы"),
              Tab(text: "Озёра"),
            ],
          ),
          DropdownButton<String>(
            value: selectedCountry,
            items: ['Кыргызстан', 'Казахстан', 'Узбекистан']
                .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                .toList(),
            onChanged: (val) => setState(() => selectedCountry = val!),
          ),
SingleChildScrollView(
  scrollDirection: Axis.horizontal,
  child: Row(
    children: categories.map((cat) => Padding(
      padding: const EdgeInsets.all(8.0),
      child: Chip(label: Text(cat)),
    )).toList(),
  ),
),
          
          
          Expanded(
            child: ListView.builder(
              itemCount: 6,
              itemBuilder: (context, index) {
                return Card(
                  margin: const EdgeInsets.all(10),
                  child: Row(
                    children: [
                      Image.network('https://picsum.photos/100?random=$index', width: 100, height: 100, fit: BoxFit.cover),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Место", style: TextStyle(fontWeight: FontWeight.bold)),
                            Flexible(child: Text("Описание очень красивого места для поездки.")),
                            Row(
                              children: [
                                const Icon(Icons.star, color: Colors.amber),
                                const Text("4.9"),
                                const Spacer(),
                                IconButton(onPressed: () {
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => FullScreenImage(index)));
                                }, icon: const Icon(Icons.remove_red_eye)),
                              ],
                            )
                          ],
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
          ),])
        );
  }
}

class FullScreenImage extends StatelessWidget {
  final int index;
  const FullScreenImage(this.index);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView.builder(
        itemCount: 6,
        itemBuilder: (context, i) => Image.network('https://picsum.photos/600?random=$i', fit: BoxFit.cover),
      ),
    );
  }
}