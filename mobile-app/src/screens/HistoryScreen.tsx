import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { swapAPI, FaceSwapItem } from '../services/api';

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<FaceSwapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = async (pageNum = 1, refresh = false) => {
    try {
      const response = await swapAPI.getHistory(pageNum);
      if (refresh) {
        setHistory(response.items);
      } else {
        setHistory(prev => [...prev, ...response.items]);
      }
      setHasMore(response.page < response.pages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadHistory(1, true);
  };

  const onLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHistory(nextPage);
    }
  };

  const deleteItem = async (id: number) => {
    Alert.alert(
      'Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await swapAPI.delete(id);
              setHistory(prev => prev.filter(item => item.id !== id));
              Alert.alert('Success', 'Item deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'processing': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const renderItem = ({ item }: { item: FaceSwapItem }) => (
    <View style={styles.item}>
      <Image
        source={{ uri: item.result_url || 'https://via.placeholder.com/80' }}
        style={styles.thumbnail}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>
          {item.swap_type.toUpperCase()} #{item.id}
        </Text>
        <Text style={styles.itemDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id)}
      >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>Start swapping faces!</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    color: '#f1f5f9',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#94a3b8',
    marginTop: 4,
  },
});
