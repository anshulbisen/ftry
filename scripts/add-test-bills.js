// Script to add test bills for different dates
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'ftry';

async function addTestBills() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const billsCollection = db.collection('bills');

    // Test bills for different dates
    const testBills = [
      {
        _id: 'test-bill-sept-20',
        bill_id: 20000001,
        invoice_uuid: 'test-uuid-001',
        bill_number: 'V/2025-26/TEST01',
        customer_id: 1000001,
        customer_name: 'Test Customer 1',
        customer_mobile: '9876543210',
        total: 1500,
        paid: 1500,
        net: 1428.57,
        tax: 71.43,
        roundoff: 0,
        payment_status: 'is_paid',
        status: true,
        selected_date: new Date('2025-09-20T00:00:00.000Z'),
        last_synced: new Date(),
        source_api: '/test',
      },
      {
        _id: 'test-bill-sept-22',
        bill_id: 20000002,
        invoice_uuid: 'test-uuid-002',
        bill_number: 'V/2025-26/TEST02',
        customer_id: 1000002,
        customer_name: 'Test Customer 2',
        customer_mobile: '9876543211',
        total: 2000,
        paid: 2000,
        net: 1904.76,
        tax: 95.24,
        roundoff: 0,
        payment_status: 'is_paid',
        status: true,
        selected_date: new Date('2025-09-22T00:00:00.000Z'),
        last_synced: new Date(),
        source_api: '/test',
      },
      {
        _id: 'test-bill-sept-28',
        bill_id: 20000003,
        invoice_uuid: 'test-uuid-003',
        bill_number: 'V/2025-26/TEST03',
        customer_id: 1000003,
        customer_name: 'Test Customer 3',
        customer_mobile: '9876543212',
        total: 3000,
        paid: 3000,
        net: 2857.14,
        tax: 142.86,
        roundoff: 0,
        payment_status: 'is_paid',
        status: true,
        selected_date: new Date('2025-09-28T00:00:00.000Z'),
        last_synced: new Date(),
        source_api: '/test',
      },
      {
        _id: 'test-bill-oct-01',
        bill_id: 20000004,
        invoice_uuid: 'test-uuid-004',
        bill_number: 'V/2025-26/TEST04',
        customer_id: 1000004,
        customer_name: 'Test Customer 4',
        customer_mobile: '9876543213',
        total: 1800,
        paid: 1800,
        net: 1714.29,
        tax: 85.71,
        roundoff: 0,
        payment_status: 'is_paid',
        status: true,
        selected_date: new Date('2025-10-01T00:00:00.000Z'),
        last_synced: new Date(),
        source_api: '/test',
      },
    ];

    // Insert test bills
    for (const bill of testBills) {
      try {
        await billsCollection.replaceOne({ _id: bill._id }, bill, { upsert: true });
        console.log(
          `✅ Added/Updated test bill for ${bill.selected_date.toISOString().split('T')[0]}: ₹${bill.paid}`,
        );
      } catch (error) {
        console.error(`Failed to insert bill ${bill._id}:`, error.message);
      }
    }

    // Show summary of all bills
    const allBills = await billsCollection
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$selected_date' } },
            count: { $sum: 1 },
            totalRevenue: { $sum: '$paid' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    console.log('\n📊 Summary of all bills in database:');
    let grandTotal = 0;
    allBills.forEach((day) => {
      console.log(`  ${day._id}: ${day.count} bills, ₹${day.totalRevenue}`);
      grandTotal += day.totalRevenue;
    });
    console.log(`  Total: ₹${grandTotal}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
addTestBills().catch(console.error);
