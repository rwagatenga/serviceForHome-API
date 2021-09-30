	//This Add Province Function
	createProvince: async function(args, req) {
		const provinces = [
	    	"Eastern", 
	    	"Kigali", 
	    	"Northern", 
	    	"Southern", 
	    	"Western"
	    ];
	    let existingProvince;
	    let createdProvince;
	    for (var i = 0; i < provinces.length; i++) {
	    	existingProvince = await Province.findOne({ provinceName: { $in: provinces } });
	    }
	    if (existingProvince) {
	      const error = new Error("Province already exists!");
	      throw error;
	    }
	    for (var i = 0; i < provinces.length; i++) {
	    	const province = new Province({
	    		provinceName: provinces[i]
	    	})
	    	createdProvince = await province.save();
	    }
	    return {
		    ...createdProvince._doc,
		    _id: createdProvince._id.toString(),
		    createdAt: createdProvince.createdAt.toISOString(),
		    updatedAt: createdProvince.updatedAt.toISOString(),
		};
	},

	// This is Add District Function
	createDistrict: async function(args, req) {
		const east = ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"];
		const kigali = ["Gasabo", "Kicukiro", "Nyarugenge",];
		const north = ["Burera", "Gakenke", "Gicumbi", "Musanze", "Nyabihu", "Rulindo",];
		const south = ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",];
		const west = ["Karongi", "Ngororero", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"];
		const districts = [...east, ...kigali, ...north, ...south, ...west];
	    let existingDistrict;
	    let createdDistrict;
	    for (var i = 0; i < districts.length; i++) {
	    	existingDistrict = await District.findOne({ districtName: { $in: districts } });
	    }
	    if (existingDistrict) {
	      const error = new Error("District already exists!");
	      throw error;
	    }
	    const peast = await Province.findOne({provinceName: "Eastern"});
	    const pkgl = await Province.findOne({provinceName: "Kigali"});
	    const pnorth = await Province.findOne({provinceName: "Northern"});
	    const psouth = await Province.findOne({provinceName: "Southern"});
	    const pwest = await Province.findOne({provinceName: "Western"});

	    for (var i = 0; i < east.length; i++) {
	    	const est = new District({
	    		districtName: east[i],
	    		provinceId: peast
	    	});
	    	peast.districtId.push(await est.save());
	    	await peast.save();
	    };
	    for (var i = 0; i < kigali.length; i++) {
	    	const kgl = new District({
	    		districtName: kigali[i],
	    		provinceId: pkgl
	    	});
	    	pkgl.districtId.push(await kgl.save());
	    	await pkgl.save();
	    };
	    for (var i = 0; i < north.length; i++) {
	    	const nrth = new District({
	    		districtName: north[i],
	    		provinceId: pnorth
	    	});
	    	pnorth.districtId.push(await nrth.save());
	    	await pnorth.save();
	    };
	    for (var i = 0; i < south.length; i++) {
	    	const sth = new District({
	    		districtName: south[i],
	    		provinceId: psouth
	    	});
	    	psouth.districtId.push(await sth.save());
	    	await psouth.save();
	    };
	    for (var i = 0; i < west.length; i++) {
	    	const wst = new District({
	    		districtName: west[i],
	    		provinceId: pwest
	    	});
	    	createdDistrict = await wst.save();
	    	pwest.districtId.push(createdDistrict);
	    	await pwest.save();
	    };
	    return {
	    	...createdDistrict._doc,
	    	_id: createdDistrict._id.toString(),
	    	createdAt: createdDistrict.createdAt.toISOString(),
	    	updatedAt: createdDistrict.updatedAt.toISOString()
	    };
	},
	searchProvince: async function(args, req) {
		const provinces = await Province.findAll();
		return {
	    	...provinces._doc,
	    	_id: provinces._id.toString(),
	    	createdAt: provinces.createdAt.toISOString(),
	    	updatedAt: provinces.updatedAt.toISOString(),
	    };
	},
	// This is Adding Sector Function
	// This is Add District Function
	createSector: async function(args, req) {
		const bugesera = ['Gashora', 'Juru', 'Mareba', 'Mayange', 'Musenyi', 'Mwogo', 'Ngeruka', 'Ntarama', 'Nyamata', 'Nyarugenge', 'Rilima', 'Ruhuha', 'Rweru', 'Shyara']; 
		const gatsibo = ['Gasange', 'Gatsibo', 'Gitoki', 'Kabarore', 'Kageyo', 'Kiramuruzi', 'Kiziguro', 'Muhura', 'Murambi', 'Ngarama', 'Nyagihanga', 'Remera', 'Rugarama', 'Rwimbogo'];
		const kayonza = ['Gahini', 'Kabare', 'Kabarondo', 'Mukarange', 'Murama', 'Murundi', 'Mwiri', 'Ndego', 'Nyamirama', 'Rukara', 'Ruramira', 'Rwinkwavu'];
		const kirehe = ['Gahara', 'Gatore', 'Kigarama', 'Kigina', 'Kirehe', 'Mahama', 'Mpanga', 'Musaza', 'Mushikiri', 'Nasho', 'Nyamugari', 'Nyarubuye'];
		const ngoma = ['Gashanda', 'Jarama', 'Karembo', 'Kazo', 'Kibungo', 'Mugesera', 'Murama', 'Mutenderi', 'Remera', 'Rukira', 'Rukumberi', 'Rurenge', 'Sake', 'Zaza']; 
		const nyagatare = ['Gatunda', 'Karama', 'Karangazi', 'Katabagemu', 'Kiyombe', 'Matimba', 'Mimuri', 'Mukama', 'Musheri', 'Nyagatare', 'Rukomo', 'Rwempasha', 'Rwimiyaga', 'Tabagwe'];
		const rwamagana = ['Fumbwe', 'Gahengeri', 'Gishali', 'Karenge', 'Kigabiro', 'Muhazi', 'Munyaga', 'Munyiginya', 'Musha', 'Muyumbu', 'Mwulire', 'Nyakaliro', 'Nzige', 'Rubona'];
		const gasabo = ['Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali', 'Kacyiru', 'Kimihurura', 'Kimiromko', 'Kinyinya', 'Ndera', 'Nduba', 'Remera', 'Rusororo', 'Rutunga'];
		const kicukiro = ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama', 'Masaka', 'Niboye', 'Nyarugunga'];
		const nyarugenge = ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'];
		const burera = ['Bungwe', 'Butaro', 'Cyanika', 'Cyeru', 'Gahunga', 'Gatebe', 'Gitovu', 'Kagogo', 'Kinoni', 'Kinyababa', 'Kivuye', 'Nemba', 'Rugarama', 'Rugengabari', 'Ruhunde', 'Rusarabuye', 'Rwerere']; 
		const gakenke = ['Busengo', 'Coko', 'Cyabingo', 'Gakenke', 'Gashenyi', 'Janja', 'Kamubuga', 'Karambo', 'Kivuruga', 'Mataba', 'Minazi', 'Mugunga', 'Muhondo', 'Muyongwe', 'Muzo', 'Nemba', 'Ruli', 'Rusasa', 'Rushashi'];
		const gicumbi = ['Bukure', 'Bwisige', 'Byumba', 'Cyumba', 'Giti', 'Kageyo', 'Kaniga', 'Manyagiro', 'Miyove', 'Mukarange', 'Muko', 'Mutete', 'Nyamiyaga', 'Nyankenke', 'Rubaya', 'Rukomo', 'Rushaki', 'Rutare', 'Ruvune', 'Rwamiko', 'Shangasha'];
		const musanze = ['Busogo', 'Cyuve', 'Gacaca', 'Gashaki', 'Gataraga', 'Kimonyi', 'Kinigi', 'Muhoza', 'Muko', 'Musanze', 'Nkotsi', 'Nyange', 'Remera', 'Rwaza', 'Shingiro'];
		const nyabihu = ['Bigogwe', 'Jenda', 'Jomba', 'Kabatwa', 'Karago', 'Kintobo', 'Mukamira', 'Muringa', 'Rambura', 'Rugera', 'Rurembo', 'Shyira'];
		const rulindo = ['Bweramana', 'Byimana', 'Kabagali', 'Kinazi', 'Kinihira', 'Mbuye', 'Mwendo', 'Ntongwe', 'Ruhango']; 
		const gisagara = ['Gikonko',  'Gishubi', 'Kansi', 'Kibirizi', 'Kigembe', 'Mamba', 'Muganza', 'Mugombwa', 'Mukingo', 'Musha', 'Ndora', 'Nyanza', 'Save'];
		const huye = ['Gishamvu', 'Huye', 'Karama', 'Kigoma', 'Kinazi', 'Maraba', 'Mbazi', 'Mukura', 'Ngoma', 'Ruhashya', 'Rusatira', 'Rwaniro', 'Simbi', 'Tumba'];
		const kamonyi = ['Gacurabwenge', 'Karama', 'Kayenzi', 'Kayumbu', 'Mugina', 'Musambira', 'Ngamba', 'Nyamiyaga', 'Nyarubaka', 'Rugarika', 'Rukoma', 'Runda'];
		const muhanga = ['Cyeza', 'Kabacuzi', 'Kibangu', 'Kiyumba', 'Muhanga', 'Mushishiro', 'Nyabinoni', 'Nyamabuye', 'Nyarusange', 'Rongi', 'Rugendabari', 'Shyogwe'];
		const nyamagabe = ['Buruhukiro', 'Cyanika', 'Gasaka', 'Gatare', 'Kaduha', 'Kamegeri', 'Kibirizi', 'Kibumbwe', 'Kitabi', 'Mbazi', 'Mugano', 'Musange', 'Musebeya', 'Mushubi', 'Nkomane', 'Tare', 'Uwinkingi'];
		const nyanza = ['Busasamana', 'Busoro', 'Cyabakamyi', 'Kibirizi', 'Kigoma', 'Mukingo', 'Muyira', 'Ntyazo', 'Nyagisozi', 'Rwabicuma'];
		const nyaruguru = ['Busanze', 'Cyahinda', 'Kibeho', 'Kivu', 'Mata', 'Muganza', 'Munini', 'Ngera', 'Ngoma', 'Nyabimata', 'Nyagisozi', 'Ruheru', 'Ruramba', 'Rusenge'];
		const ruhango = ['Bweramana', 'Byimana', 'Kabagali', 'Kinazi', 'Kinihira', 'Mbuye', 'Mwendo', 'Ntongwe', 'Ruhango'];
		const karongi = ['Bwishyura', 'Gishari', 'Gishyita', 'Gitesi', 'Mubuga', 'Murambi', 'Murundi', 'Mutuntu', 'Rubengera', 'Rugabano', 'Ruganda', 'Rwankuba', 'Twumba'];
		const ngororero = ['Bwira', 'Gatumba', 'Hindiro', 'Kabaya', 'Kageyo', 'Kavumu', 'Matyazo', 'Muhanda', 'Muhororo', 'Ndaro', 'Ngororero', 'Nyange', 'Sovu']; 
		const nyamasheke = ['Bushekeri', 'Bushenge', 'Cyato', 'Gihombo', 'Kagano', 'Kanjongo', 'Karambi', 'Karengera', 'Kirimbi', 'Macuba', 'Mahembe', 'Nyabitekeri', 'Rangiro', 'Ruharambuga', 'Shangi'];
		const rubavu = ['Bugeshi', 'Busasamana', 'Cyanzarwe', 'Gisenyi', 'Kanama', 'Kanzenze', 'Mudende', 'Nyakiriba', 'Nyamyumba', 'Nyundo', 'Rubavu', 'Rugerero'];
		const rusizi = ['Bugarama', 'Butare', 'Bweyeye', 'Gashonga', 'Giheke', 'Gihundwe', 'Gikundamvura', 'Gitambi', 'Kamembe', 'Muganza', 'Mururu', 'Nkanka', 'Nkombo', 'Nkungu', 'Nyakabuye', 'Nyakarenzo', 'Nzahaha', 'Rwimbogo'];
		const rutsiro = ['Boneza', 'Gihango', 'Kigeyo', 'Kivumu', 'Manihira', 'Mukura', 'Murunda', 'Musasa', 'Mushonyi', 'Mushubati', 'Nyabirasi', 'Ruhango', 'Rusebeya'];
		const sectors = [...bugesera, ...gatsibo, ...kayonza, ...kirehe, ...ngoma, ...nyagatare, ...rwamagana, ...gasabo, ...kicukiro, ...nyarugenge, ...burera, ...gakenke, ...gicumbi, ...musanze, ...nyabihu, ...rulindo, ...gisagara, ...huye, ...kamonyi, ...muhanga, ...nyamagabe, ...nyanza, ...nyaruguru, ...ruhango, ...karongi, ...ngororero, ...nyamasheke, ...rubavu, ...rusizi, ...rutsiro];
	    let existingSector;
	    let createdSector;
	    for (var i = 0; i < sectors.length; i++) {
	    	existingSector = await Sector.findOne({ sectorName: { $in: sectors } });
	    }
	    if (existingSector) {
	      const error = new Error("Sector already exists!");
	      throw error;
	    }
	    const bgsr = await District.findOne({ districtName: "Bugesera" });
		const gtsb = await District.findOne({ districtName: "Gatsibo" });
		const kynza = await District.findOne({ districtName: "Kayonza" });
		const krh = await District.findOne({ districtName: "Kirehe" });
		const ngm = await District.findOne({ districtName: "Ngoma" });
		const nygt = await District.findOne({ districtName: "Nyagatare" });
		const rwmgn = await District.findOne({ districtName: "Rwamagana" });
		const gsb = await District.findOne({ districtName: "Gasabo" });
		const kckr = await District.findOne({ districtName: "Kicukiro" });
		const nyrgng = await District.findOne({ districtName: "Nyarugenge" });
		const brr = await District.findOne({ districtName: "Burera" });
		const gknk = await District.findOne({ districtName: "Gakenke" });
		const gcmb = await District.findOne({ districtName: "Gicumbi" });
		const msnz = await District.findOne({ districtName: "Musanze" });
		const nybh = await District.findOne({ districtName: "Nyabihu" });
		const rlndo = await District.findOne({ districtName: "Rulindo" });
		const gsgr = await District.findOne({ districtName: "Gisagara" });
		const hy = await District.findOne({ districtName: "Huye" });
		const kmny = await District.findOne({ districtName: "Kamonyi" });
		const mhng = await District.findOne({ districtName: "Muhanga" });
		const nymgb = await District.findOne({ districtName: "Nyamagabe" });
		const nynz = await District.findOne({ districtName: "Nyanza" });
		const nyrgr = await District.findOne({ districtName: "Nyaruguru" });
		const rhng = await District.findOne({ districtName: "Ruhango" });
		const krng = await District.findOne({ districtName: "Karongi" });
		const ngrrr = await District.findOne({ districtName: "Ngororero" });
		const nymshk = await District.findOne({ districtName: "Nyamasheke" });
		const rbv = await District.findOne({ districtName: "Rubavu" });
		const rsz = await District.findOne({ districtName: "Rusizi" });
		const rtsr = await District.findOne({ districtName: "Rutsiro" });

	    for (var i = 0; i < bugesera.length; i++) {
	    	const bgsra = new Sector({
	    		sectorName: bugesera[i],
	    		districtId: bgsr
	    	});
	    	bgsr.sectorId.push(await bgsra.save());
	    	await bgsr.save();
	    };

	    for (var i = 0; i < gatsibo.length; i++) {
	    	const gtsbo = new Sector({
	    		sectorName: gatsibo[i],
	    		districtId: gtsb
	    	});
	    	gtsb.sectorId.push(await gtsbo.save());
	    	await gtsb.save();
	    };
	    for (var i = 0; i < kayonza.length; i++) {
	    	const kynz = new Sector({
	    		sectorName: kayonza[i],
	    		districtId: kynza
	    	});
	    	kynza.sectorId.push(await kynz.save());
	    	await kynza.save();
	    }
	    for (var i = 0; i < kirehe.length; i++) {
	    	const krhe = new Sector({
	    		sectorName: kirehe[i],
	    		districtId: krh
	    	});
	    	krh.sectorId.push(await krhe.save());
	    	await krh.save();
	    }
	    for (var i = 0; i < ngoma.length; i++) {
	    	const ngma = new Sector({
	    		sectorName: ngoma[i],
	    		districtId: ngm
	    	});
	    	ngm.sectorId.push(await ngma.save());
	    	await ngm.save();
	    }
	    for (var i = 0; i < nyagatare.length; i++) {
	    	const nygta = new Sector({
	    		sectorName: nyagatare[i],
	    		districtId: nygt
	    	});
	    	nygt.sectorId.push(await nygta.save());
	    	await nygt.save();
	    }
	    for (var i = 0; i < rwamagana.length; i++) {
	    	const rwmgna = new Sector({
	    		sectorName: rwamagana[i],
	    		districtId: rwmgn
	    	});
	    	rwmgn.sectorId.push(await rwmgna.save());
	    	await rwmgn.save();
	    }
	    for (var i = 0; i < gasabo.length; i++) {
	    	const gsbo = new Sector({
	    		sectorName: gasabo[i],
	    		districtId: gsb
	    	});
	    	gsb.sectorId.push(await gsbo.save());
	    	await gsb.save();
	    }
	    for (var i = 0; i < kicukiro.length; i++) {
	    	const kckro = new Sector({
	    		sectorName: kicukiro[i],
	    		districtId: kckr
	    	});
	    	kckr.sectorId.push(await kckro.save());
	    	await kckr.save();
	    }
	    for (var i = 0; i < nyarugenge.length; i++) {
	    	const nyrgnge = new Sector({
	    		sectorName: nyarugenge[i],
	    		districtId: nyrgng
	    	});
	    	nyrgng.sectorId.push(await nyrgnge.save());
	    	await nyrgng.save();
	    }
	    for (var i = 0; i < burera.length; i++) {
	    	const brra = new Sector({
	    		sectorName: burera[i],
	    		districtId: brr
	    	});
	    	brr.sectorId.push(await brra.save());
	    	await brr.save();
	    }
	    for (var i = 0; i < gakenke.length; i++) {
	    	const gknke = new Sector({
	    		sectorName: gakenke[i],
	    		districtId: gknk
	    	});
	    	gknk.sectorId.push(await gknke.save());
	    	await gknk.save();
	    }
	    for (var i = 0; i < gicumbi.length; i++) {
	    	const gcmbi = new Sector({
	    		sectorName: gicumbi[i],
	    		districtId: gcmb
	    	});
	    	gcmb.sectorId.push(await gcmbi.save());
	    	await gcmb.save();
	    }
	    for (var i = 0; i < musanze.length; i++) {
	    	const msnze = new Sector({
	    		sectorName: musanze[i],
	    		districtId: msnz
	    	});
	    	msnz.sectorId.push(await msnze.save());
	    	await msnz.save();
	    }
	    for (var i = 0; i < nyabihu.length; i++) {
	    	const nybhu = new Sector({
	    		sectorName: nyabihu[i],
	    		districtId: nybh
	    	});
	    	nybh.sectorId.push(await nybhu.save());
	    	await nybh.save();
	    }
	    for (var i = 0; i < rulindo.length; i++) {
	    	const rlnd = new Sector({
	    		sectorName: rulindo[i],
	    		districtId: rlndo
	    	});
	    	rlndo.sectorId.push(await rlnd.save());
	    	await rlndo.save();
	    }
	    for (var i = 0; i < gisagara.length; i++) {
	    	const gsgra = new Sector({
	    		sectorName: gisagara[i],
	    		districtId: gsgr
	    	});
	    	gsgr.sectorId.push(await gsgra.save());
	    	await gsgr.save();
	    }
	    for (var i = 0; i < huye.length; i++) {
	    	const hye = new Sector({
	    		sectorName: huye[i],
	    		districtId: hy
	    	});
	    	hy.sectorId.push(await hye.save());
	    	await hy.save();
	    }
	    for (var i = 0; i < kamonyi.length; i++) {
	    	const kmnyi = new Sector({
	    		sectorName: kamonyi[i],
	    		districtId: kmny
	    	});
	    	kmny.sectorId.push(await kmnyi.save());
	    	await kmny.save();
	    }
	    for (var i = 0; i < muhanga.length; i++) {
	    	const mhnga = new Sector({
	    		sectorName: muhanga[i],
	    		districtId: mhng
	    	});
	    	mhng.sectorId.push(await mhnga.save());
	    	await mhng.save();
	    }
	    for (var i = 0; i < nyamagabe.length; i++) {
	    	const nymgbe = new Sector({
	    		sectorName: nyamagabe[i],
	    		districtId: nymgb
	    	});
	    	nymgb.sectorId.push(await nymgbe.save());
	    	await nymgb.save();
	    }
	    for (var i = 0; i < nyanza.length; i++) {
	    	const nynza = new Sector({
	    		sectorName: nyanza[i],
	    		districtId: nynz
	    	});
	    	nynz.sectorId.push(await nynza.save());
	    	await nynz.save();
	    }
	    for (var i = 0; i < nyaruguru.length; i++) {
	    	const nyrgru = new Sector({
	    		sectorName: nyaruguru[i],
	    		districtId: nyrgr
	    	});
	    	nyrgr.sectorId.push(await nyrgru.save());
	    	await nyrgr.save();
	    }
	    for (var i = 0; i < ruhango.length; i++) {
	    	const rhngo = new Sector({
	    		sectorName: ruhango[i],
	    		districtId: rhng
	    	});
	    	rhng.sectorId.push(await rhngo.save());
	    	await rhng.save();
	    }
	    for (var i = 0; i < karongi.length; i++) {
	    	const krngi = new Sector({
	    		sectorName: karongi[i],
	    		districtId: krng
	    	});
	    	krng.sectorId.push(await krngi.save());
	    	await krng.save();
	    }
	    for (var i = 0; i < ngororero.length; i++) {
	    	const ngrrro = new Sector({
	    		sectorName: ngororero[i],
	    		districtId: ngrrr
	    	});
	    	ngrrr.sectorId.push(await ngrrro.save());
	    	await ngrrr.save();
	    }
	    for (var i = 0; i < nyamasheke.length; i++) {
	    	const nymshke = new Sector({
	    		sectorName: nyamasheke[i],
	    		districtId: nymshk
	    	});
	    	nymshk.sectorId.push(await nymshke.save());
	    	await nymshk.save();
	    }
	    for (var i = 0; i < rubavu.length; i++) {
	    	const rbvu = new Sector({
	    		sectorName: rubavu[i],
	    		districtId: rbv
	    	});
	    	rbv.sectorId.push(await rbvu.save());
	    	await rbv.save();
	    }
	    for (var i = 0; i < rusizi.length; i++) {
	    	const rszi = new Sector({
	    		sectorName: rusizi[i],
	    		districtId: rsz
	    	});
	    	rsz.sectorId.push(await rszi.save());
	    	await rsz.save();
	    }
	    for (var i = 0; i < rutsiro.length; i++) {
	    	const rtsro = new Sector({
	    		sectorName: rutsiro[i],
	    		districtId: rtsr
	    	});
	    	createdSector = await rtsro.save();
	    	rtsr.sectorId.push(createdSector);
	    	await rtsr.save();
	    }
	    return {
	    	...createdSector._doc,
	    	_id: createdSector._id.toString(),
	    	createdAt: createdSector.createdAt.toISOString(),
	    	updatedAt: createdSector.updatedAt.toISOString()
	    };
	}