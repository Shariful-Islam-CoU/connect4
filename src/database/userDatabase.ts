
import mongoose from "mongoose";


main().catch(err => console.log(err));

// async function main() {
//   await mongoose.connect('mongodb://admin:qwerty@mongo:27017/connect_4?authSource=admin').then(()=>console.log("db is connected"));

// }

async function main() {
  await mongoose.connect('mongodb+srv://sharifulislam666778_db_user:hhwCJTCukGJy1VDc@sharifmongodbcluster0.0ktphsd.mongodb.net/?retryWrites=true&w=majority&appName=SharifMongoDBCluster0').then(()=>console.log("db is connected"));
}

export default  mongoose;