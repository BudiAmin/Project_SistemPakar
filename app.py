from flask import Flask, render_template, request, jsonify
import numpy as np
import skfuzzy as fuzz
import skfuzzy.control as ctrl
import os

app = Flask(__name__, static_folder="static", template_folder="templates")


# Fuzzy logic system setup
def setup_fuzzy_system():
    # Define fuzzy variables
    suara_pompa = ctrl.Antecedent(np.arange(0, 101, 1), "suara_pompa")  # 0-100 dB
    tekanan_air = ctrl.Antecedent(np.arange(0, 11, 1), "tekanan_air")  # 0-10 Bar
    putaran_motor = ctrl.Antecedent(
        np.arange(0, 3001, 1), "putaran_motor"
    )  # 0-3000 RPM
    bantuan_kipas = ctrl.Antecedent(np.arange(0, 2, 1), "bantuan_kipas")
    tingkat_kerusakan = ctrl.Consequent(
        np.arange(0, 101, 1), "tingkat_kerusakan", defuzzify_method="centroid"
    )

    # Membership functions
    suara_pompa["rendah"] = fuzz.trimf(suara_pompa.universe, [0, 0, 40])
    suara_pompa["sedang"] = fuzz.trimf(suara_pompa.universe, [30, 50, 70])
    suara_pompa["tinggi"] = fuzz.trimf(suara_pompa.universe, [60, 100, 100])

    tekanan_air["lemah"] = fuzz.trimf(tekanan_air.universe, [0, 0, 5])
    tekanan_air["sedang"] = fuzz.trimf(tekanan_air.universe, [3, 5, 7])
    tekanan_air["kuat"] = fuzz.trimf(tekanan_air.universe, [6, 10, 10])

    putaran_motor["lemah"] = fuzz.trimf(putaran_motor.universe, [0, 0, 1500])
    putaran_motor["normal"] = fuzz.trimf(putaran_motor.universe, [1000, 2000, 2500])
    putaran_motor["tinggi"] = fuzz.trimf(putaran_motor.universe, [2000, 3000, 3000])

    bantuan_kipas["tidak"] = fuzz.trimf(bantuan_kipas.universe, [0, 0, 0])
    bantuan_kipas["ya"] = fuzz.trimf(bantuan_kipas.universe, [1, 1, 1])

    tingkat_kerusakan["ringan"] = fuzz.trimf(tingkat_kerusakan.universe, [0, 0, 40])
    tingkat_kerusakan["sedang"] = fuzz.trimf(tingkat_kerusakan.universe, [30, 50, 70])
    tingkat_kerusakan["berat"] = fuzz.trimf(tingkat_kerusakan.universe, [60, 100, 100])

    # Fuzzy rules
    rule1 = ctrl.Rule(
        suara_pompa["tinggi"] & tekanan_air["lemah"], tingkat_kerusakan["berat"]
    )
    rule2 = ctrl.Rule(
        putaran_motor["lemah"] & tekanan_air["lemah"], tingkat_kerusakan["berat"]
    )
    rule3 = ctrl.Rule(bantuan_kipas["ya"], tingkat_kerusakan["sedang"])
    rule4 = ctrl.Rule(
        suara_pompa["rendah"] & tekanan_air["sedang"] & putaran_motor["normal"],
        tingkat_kerusakan["ringan"],
    )
    rule_default = ctrl.Rule(
        suara_pompa["sedang"] & tekanan_air["kuat"] & putaran_motor["normal"],
        tingkat_kerusakan["sedang"],
    )

    # Create fuzzy control system
    kerusakan_ctrl = ctrl.ControlSystem([rule1, rule2, rule3, rule4, rule_default])
    return ctrl.ControlSystemSimulation(kerusakan_ctrl)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/diagnose", methods=["POST"])
def diagnose():
    try:
        # Get input values from form
        suara = float(request.form.get("suara_pompa", 0))
        tekanan = float(request.form.get("tekanan_air", 0))
        putaran = float(request.form.get("putaran_motor", 0))
        kipas = int(request.form.get("bantuan_kipas", 0))

        # Setup fuzzy system
        kerusakan_simulasi = setup_fuzzy_system()

        # Set inputs
        kerusakan_simulasi.input["suara_pompa"] = suara
        kerusakan_simulasi.input["tekanan_air"] = tekanan
        kerusakan_simulasi.input["putaran_motor"] = putaran
        kerusakan_simulasi.input["bantuan_kipas"] = kipas

        # Compute result
        kerusakan_simulasi.compute()
        hasil = kerusakan_simulasi.output["tingkat_kerusakan"]

        # Determine specific fault type
        if hasil >= 60:
            if suara >= 60 and tekanan <= 5:
                jenis_kerusakan = "Berat: Kemungkinan seal mechanic dan bearing rusak."
                komponen_rusak = ["seal", "bearing"]
            elif putaran <= 1500 and tekanan <= 5:
                jenis_kerusakan = "Berat: Kemungkinan dinamo lemah."
                komponen_rusak = ["dinamo"]
            else:
                jenis_kerusakan = "Berat: Masalah serius, cek semua komponen utama."
                komponen_rusak = ["seal", "bearing", "dinamo", "kipas"]
            status = "berat"
        elif hasil >= 40:
            if kipas == 1:
                jenis_kerusakan = "Sedang: Kemungkinan kapasitor rusak."
                komponen_rusak = ["kipas"]
            else:
                jenis_kerusakan = "Sedang: Komponen haus seperti seal atau bearing."
                komponen_rusak = ["seal", "bearing"]
            status = "sedang"
        else:
            jenis_kerusakan = "Ringan: Mungkin hanya butuh perawatan sederhana."
            komponen_rusak = []
            status = "ringan"

        return jsonify(
            {
                "hasil": round(hasil, 2),
                "jenis_kerusakan": jenis_kerusakan,
                "komponen_rusak": komponen_rusak,
                "status": status,
                "inputs": {
                    "suara": suara,
                    "tekanan": tekanan,
                    "putaran": putaran,
                    "kipas": kipas,
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    # Create necessary directories if they don't exist
    if not os.path.exists("static"):
        os.makedirs("static")
    if not os.path.exists("static/css"):
        os.makedirs("static/css")
    if not os.path.exists("static/js"):
        os.makedirs("static/js")
    if not os.path.exists("static/images"):
        os.makedirs("static/images")
    if not os.path.exists("templates"):
        os.makedirs("templates")

    app.run(debug=True)
