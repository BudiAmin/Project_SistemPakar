import numpy as np
import matplotlib.pyplot as plt


# Fungsi segitiga manual
def trimf(x, a, b, c):
    if x <= a or x >= c:
        return 0.0
    elif a < x < b:
        return (x - a) / (b - a)
    elif b <= x < c:
        return (c - x) / (c - b)
    elif x == b:
        return 1.0
    return 0.0


# Fungsi keanggotaan untuk setiap input
def fuzzify_input(suara_pompa, tekanan_air, putaran_motor, bantuan_kipas):
    # Suara Pompa
    μ_suara = {
        "rendah": trimf(suara_pompa, 0, 0, 40),
        "sedang": trimf(suara_pompa, 30, 50, 70),
        "tinggi": trimf(suara_pompa, 60, 100, 100),
    }

    # Tekanan Air
    μ_tekanan = {
        "lemah": trimf(tekanan_air, 0, 0, 5),
        "sedang": trimf(tekanan_air, 3, 5, 7),
        "kuat": trimf(tekanan_air, 6, 10, 10),
    }

    # Putaran Motor
    μ_putaran = {
        "lemah": trimf(putaran_motor, 0, 0, 1500),
        "normal": trimf(putaran_motor, 1000, 2000, 2500),
        "tinggi": trimf(putaran_motor, 2000, 3000, 3000),
    }

    # Bantuan Kipas
    μ_kipas = {
        "tidak": 1.0 if bantuan_kipas == 0 else 0.0,
        "ya": 1.0 if bantuan_kipas == 1 else 0.0,
    }

    return μ_suara, μ_tekanan, μ_putaran, μ_kipas


# Fungsi keanggotaan output kerusakan
def output_memberships(x):
    return {
        "ringan": trimf(x, 0, 0, 40),
        "sedang": trimf(x, 30, 50, 70),
        "berat": trimf(x, 60, 100, 100),
    }


# Rule evaluation (manual)
def apply_rules(μ_suara, μ_tekanan, μ_putaran, μ_kipas):
    rules = []

    # Rule 1: suara tinggi AND tekanan lemah => berat
    rules.append(("berat", min(μ_suara["tinggi"], μ_tekanan["lemah"])))

    # Rule 2: putaran lemah AND tekanan lemah => berat
    rules.append(("berat", min(μ_putaran["lemah"], μ_tekanan["lemah"])))

    # Rule 3: bantuan kipas ya => sedang
    rules.append(("sedang", μ_kipas["ya"]))

    # Rule 4: suara rendah AND tekanan sedang AND putaran normal => ringan
    rules.append(
        ("ringan", min(μ_suara["rendah"], μ_tekanan["sedang"], μ_putaran["normal"]))
    )

    # Rule Default: suara sedang AND tekanan kuat AND putaran normal => sedang
    rules.append(
        ("sedang", min(μ_suara["sedang"], μ_tekanan["kuat"], μ_putaran["normal"]))
    )

    return rules


# Defuzzifikasi (metode centroid)
def defuzzify(rules):
    x = np.linspace(0, 100, 1000)
    aggregated = np.zeros_like(x)

    for label, alpha in rules:
        for i, xi in enumerate(x):
            μ = output_memberships(xi)[label]
            aggregated[i] = max(aggregated[i], min(alpha, μ))

    if np.sum(aggregated) == 0:
        return 0
    return np.sum(x * aggregated) / np.sum(aggregated)


# Main program
def main():
    print("=== SISTEM FUZZY DIAGNOSA POMPA (Tanpa skfuzzy) ===")
    suara = float(input("Masukkan suara pompa (0-100 dB): "))
    tekanan = float(input("Masukkan tekanan air (0-10 bar): "))
    putaran = float(input("Masukkan putaran motor (0-3000 rpm): "))
    kipas = int(input("Bantuan kipas aktif? (1: ya, 0: tidak): "))

    μ_suara, μ_tekanan, μ_putaran, μ_kipas = fuzzify_input(
        suara, tekanan, putaran, kipas
    )
    rules = apply_rules(μ_suara, μ_tekanan, μ_putaran, μ_kipas)

    print("\n=== Derajat Keanggotaan Input ===")
    print(
        f"Suara Tinggi: {μ_suara['tinggi']:.2f}, Sedang: {μ_suara['sedang']:.2f}, Rendah: {μ_suara['rendah']:.2f}"
    )
    print(
        f"Tekanan Lemah: {μ_tekanan['lemah']:.2f}, Sedang: {μ_tekanan['sedang']:.2f}, Kuat: {μ_tekanan['kuat']:.2f}"
    )
    print(
        f"Putaran Lemah: {μ_putaran['lemah']:.2f}, Normal: {μ_putaran['normal']:.2f}, Tinggi: {μ_putaran['tinggi']:.2f}"
    )
    print(f"Kipas Aktif: {μ_kipas['ya']:.2f}, Tidak Aktif: {μ_kipas['tidak']:.2f}")

    print("\n=== Evaluasi Rules ===")
    for i, (label, alpha) in enumerate(rules, 1):
        print(f"Rule {i}: {label.upper()} dengan α = {alpha:.2f}")

    hasil = defuzzify(rules)

    if hasil < 40:
        status = "Ringan"
    elif hasil < 60:
        status = "Sedang"
    else:
        status = "Berat"

    print("\n=== HASIL AKHIR ===")
    print(f"Nilai Defuzzifikasi (Centroid): {hasil:.2f}")
    print(f"Tingkat Kerusakan: {status}")
    plot_output_fuzzy(rules, hasil)


def plot_output_fuzzy(rules, hasil_defuzzifikasi):
    x = np.linspace(0, 100, 1000)
    memberships = {
        "ringan": [trimf(xi, 0, 0, 40) for xi in x],
        "sedang": [trimf(xi, 30, 50, 70) for xi in x],
        "berat": [trimf(xi, 60, 100, 100) for xi in x],
    }

    # Agregasi output
    aggregated = np.zeros_like(x)
    for label, alpha in rules:
        curve = np.array(memberships[label])
        clipped = np.minimum(curve, alpha)
        aggregated = np.maximum(aggregated, clipped)

    # Plot semua
    plt.figure(figsize=(10, 6))
    plt.plot(x, memberships["ringan"], "g--", label="Ringan")
    plt.plot(x, memberships["sedang"], "b--", label="Sedang")
    plt.plot(x, memberships["berat"], "r--", label="Berat")
    plt.fill_between(x, 0, aggregated, color="gray", alpha=0.5, label="Agregasi Output")

    # Centroid (hasil defuzzifikasi)
    plt.axvline(
        hasil_defuzzifikasi,
        color="black",
        linestyle=":",
        linewidth=2,
        label=f"Defuzzifikasi: {hasil_defuzzifikasi:.2f}",
    )

    plt.title("Fungsi Keanggotaan Output: Tingkat Kerusakan")
    plt.xlabel("Tingkat Kerusakan (%)")
    plt.ylabel("Derajat Keanggotaan")
    plt.legend()
    plt.grid(True)
    plt.show()


if __name__ == "__main__":
    main()
