const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory storage
const rooms = [];
const bookings = [];

// Utility function to check availability
function isRoomAvailable(roomId, date, startTime, endTime) {
  return !bookings.some(booking => 
    booking.roomId === roomId && 
    booking.date === date && 
    ((booking.startTime <= startTime && booking.endTime > startTime) || 
     (booking.startTime < endTime && booking.endTime >= endTime) || 
     (booking.startTime >= startTime && booking.endTime <= endTime))
  );
}

// Endpoint to create a room
app.post('/rooms', (req, res) => {
  const { name, seats, amenities, pricePerHour } = req.body;
  const roomId = rooms.length + 1;
  rooms.push({ roomId, name, seats, amenities, pricePerHour });
  res.status(201).send({ roomId, name, seats, amenities, pricePerHour });
});

// Endpoint to book a room
app.post('/bookings', (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;
  if (!isRoomAvailable(roomId, date, startTime, endTime)) {
    return res.status(400).send('Room is already booked for the selected time slot');
  }
  const bookingId = bookings.length + 1;
  const bookingDate = new Date().toISOString();
  bookings.push({ bookingId, customerName, date, startTime, endTime, roomId, bookingDate });
  res.status(201).send({ bookingId, customerName, date, startTime, endTime, roomId, bookingDate });
});

// Endpoint to list all rooms with booked data
app.get('/rooms', (req, res) => {
  const result = rooms.map(room => {
    const roomBookings = bookings.filter(booking => booking.roomId === room.roomId);
    return { ...room, bookings: roomBookings };
  });
  res.send(result);
});

// Endpoint to list all customers with booked data
app.get('/customers', (req, res) => {
  const customers = [];
  bookings.forEach(booking => {
    const customer = customers.find(c => c.customerName === booking.customerName);
    if (customer) {
      customer.bookings.push(booking);
    } else {
      customers.push({ customerName: booking.customerName, bookings: [booking] });
    }
  });
  res.send(customers);
});

// Endpoint to list how many times a customer has booked a room
app.get('/customers/:customerName/bookings', (req, res) => {
  const { customerName } = req.params;
  const customerBookings = bookings.filter(booking => booking.customerName === customerName);
  res.send(customerBookings);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
