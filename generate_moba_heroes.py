import bpy
import math
import os

def clean_scene():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)

def create_matte_mat(name, hex_code, roughness=0.82, metalness=0.08):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        h = hex_code.lstrip('#')
        r = (int(h[0:2], 16) / 255.0) ** 2.2
        g = (int(h[2:4], 16) / 255.0) ** 2.2
        b = (int(h[4:6], 16) / 255.0) ** 2.2
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
        if 'Roughness' in bsdf.inputs:
            bsdf.inputs['Roughness'].default_value = roughness
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = metalness
    return mat

def apply_mesh(obj, col, mat=None):
    if obj.type == 'MESH':
        if mat:
            if len(obj.data.materials) == 0:
                obj.data.materials.append(mat)
            else:
                obj.data.materials[0] = mat
        for poly in obj.data.polygons:
            poly.use_smooth = False
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)
    return obj

def create_pedestal(x, col, mat_base, mat_accent):
    # Tier 1 base
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=1.35, depth=0.15, location=(x, 0, 0.075))
    base1 = apply_mesh(bpy.context.active_object, col, mat_base)
    base1.name = f"Pedestal_Base_{x}"
    
    # Tier 2 upper ring with chamfer
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=1.1, depth=0.15, location=(x, 0, 0.225))
    base2 = apply_mesh(bpy.context.active_object, col, mat_base)
    base2.name = f"Pedestal_Top_{x}"

    # Inlaid runic ring
    bpy.ops.mesh.primitive_torus_add(major_radius=1.05, minor_radius=0.04, major_segments=8, minor_segments=4, location=(x, 0, 0.3))
    ring = apply_mesh(bpy.context.active_object, col, mat_accent)
    ring.name = f"Pedestal_RuneRing_{x}"

def build_natural_hero(hero, main_col):
    x = hero["x"]
    role = hero["role"]
    name = hero["name"]
    
    col = bpy.data.collections.new(f"{name}_{role}")
    main_col.children.link(col)
    
    m_pri = create_matte_mat(f"{hero['id']}_Pri", hero["c_pri"])
    m_sec = create_matte_mat(f"{hero['id']}_Sec", hero["c_sec"], roughness=0.88, metalness=0.05)
    m_acc = create_matte_mat(f"{hero['id']}_Acc", hero["c_acc"], roughness=0.45, metalness=0.2)
    m_dark = create_matte_mat(f"{hero['id']}_Dark", "#1A1A20", roughness=0.92, metalness=0.0)
    m_cloth = create_matte_mat(f"{hero['id']}_Cloth", hero.get("c_cloth", hero["c_sec"]), roughness=0.95, metalness=0.0)

    # 1. Pedestal
    create_pedestal(x, col, m_dark, m_acc)

    # 2. Pelvis & Hip Girdle (Natural anatomical junction)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.38, depth=0.28, location=(x, 0, 1.15))
    pelvis = apply_mesh(bpy.context.active_object, col, m_sec)
    pelvis.scale = (1.1, 0.8, 1.0)
    pelvis.name = f"{name}_Pelvis"

    # Belt & Buckle
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.42, depth=0.1, location=(x, 0, 1.28))
    belt = apply_mesh(bpy.context.active_object, col, m_dark)
    belt.scale = (1.08, 0.85, 1.0)
    
    bpy.ops.mesh.primitive_cube_add(size=0.12, location=(x, 0.36, 1.28))
    buckle = apply_mesh(bpy.context.active_object, col, m_acc)

    # 3. Torso (Two-stage: lower abdomen + upper chest)
    # Abdomen (flexible waist)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.36, depth=0.3, location=(x, 0, 1.45))
    ab = apply_mesh(bpy.context.active_object, col, m_dark)
    ab.scale = (1.05, 0.75, 1.0)

    # Chest & Ribcage (flaring broader upward, tapered cone)
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.42, radius2=0.52, depth=0.45, location=(x, 0, 1.78))
    chest = apply_mesh(bpy.context.active_object, col, m_pri)
    chest.scale = (1.15, 0.8, 1.0)
    chest.name = f"{name}_Chest"

    # Chest Armor Plating (Segmented)
    bpy.ops.mesh.primitive_cube_add(size=0.38, location=(x, 0.22, 1.82))
    c_plate = apply_mesh(bpy.context.active_object, col, m_sec)
    c_plate.scale = (1.2, 0.45, 0.9)

    # Insignia Core
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.1, location=(x, 0.34, 1.84))
    insignia = apply_mesh(bpy.context.active_object, col, m_acc)

    # 4. Neck & Collar
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.18, depth=0.2, location=(x, 0, 2.08))
    neck = apply_mesh(bpy.context.active_object, col, m_dark)

    # Gorget / Collar Plate
    bpy.ops.mesh.primitive_torus_add(major_radius=0.28, minor_radius=0.06, major_segments=6, minor_segments=4, location=(x, 0, 2.05))
    gorget = apply_mesh(bpy.context.active_object, col, m_sec)

    # 5. Natural Articulated Legs (Thigh -> Knee -> Calf -> Boot)
    leg_poses = [
        {"x_off": -0.26, "angle": math.radians(4)},
        {"x_off": 0.26, "angle": math.radians(-4)}
    ]
    for i, lp in enumerate(leg_poses):
        side = "L" if i == 0 else "R"
        lx = x + lp["x_off"]
        
        # Thigh (tapered downward)
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.16, radius2=0.12, depth=0.45, location=(lx, 0, 0.92))
        thigh = apply_mesh(bpy.context.active_object, col, m_dark)
        thigh.rotation_euler = (0, 0, lp["angle"])

        # Knee Guard (faceted diamond)
        bpy.ops.mesh.primitive_cube_add(size=0.14, location=(lx + (0.02 if side=="R" else -0.02), 0.12, 0.68))
        knee = apply_mesh(bpy.context.active_object, col, m_sec)
        knee.rotation_euler = (math.radians(45), 0, lp["angle"])

        # Calf (tapered to ankle)
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.13, radius2=0.10, depth=0.42, location=(lx, 0, 0.46))
        calf = apply_mesh(bpy.context.active_object, col, m_pri)

        # Boot & Heel (directional foot)
        bpy.ops.mesh.primitive_cube_add(size=0.18, location=(lx, 0.06, 0.18))
        boot = apply_mesh(bpy.context.active_object, col, m_sec)
        boot.scale = (0.9, 1.6, 0.8)

    # 6. Natural Articulated Arms & Hands
    # Left & Right Shoulders / Deltoid base
    for i, sx in enumerate([-0.58, 0.58]):
        side = "L" if i == 0 else "R"
        # Bicep / Upper Arm
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.13, radius2=0.10, depth=0.42, location=(x + sx, 0, 1.68))
        bicep = apply_mesh(bpy.context.active_object, col, m_dark)

        # Elbow Couter
        bpy.ops.mesh.primitive_cube_add(size=0.12, location=(x + sx, -0.08, 1.46))
        elbow = apply_mesh(bpy.context.active_object, col, m_sec)

        # Forearm / Gauntlet
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.11, radius2=0.09, depth=0.4, location=(x + sx, 0.04, 1.25))
        forearm = apply_mesh(bpy.context.active_object, col, m_pri)

        # Fist / Hand holding grip
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.09, location=(x + sx, 0.08, 1.02))
        hand = apply_mesh(bpy.context.active_object, col, m_sec)

    # 7. Pauldrons & Shoulder Silhouette (Character specific)
    if role == "Fighter":
        # Heavy layered jagged iron pauldrons
        for sx in [-0.68, 0.68]:
            bpy.ops.mesh.primitive_cube_add(size=0.38, location=(x + sx, 0, 1.95))
            p = apply_mesh(bpy.context.active_object, col, m_sec)
            p.scale = (1.0, 0.9, 0.8)
            p.rotation_euler = (0, math.radians(-15 if sx > 0 else 15), 0)
            # Spiked ridge
            bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.08, depth=0.3, location=(x + sx * 1.05, 0, 2.12))
            spike = apply_mesh(bpy.context.active_object, col, m_acc)

    elif role == "Mage":
        # Floating crystalline orbital shards
        for sx in [-0.72, 0.72]:
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.18, location=(x + sx, 0, 2.0))
            shard = apply_mesh(bpy.context.active_object, col, m_acc)
            shard.scale = (0.7, 0.7, 1.5)
            shard.rotation_euler = (math.radians(15), 0, math.radians(-20 if sx>0 else 20))

    elif role == "Marksman":
        # Asymmetrical: Left heavy archer guard, right sleek
        bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.22, depth=0.35, location=(x - 0.68, 0, 1.95))
        pauld_l = apply_mesh(bpy.context.active_object, col, m_sec)
        pauld_l.rotation_euler = (0, 0, math.radians(25))

        bpy.ops.mesh.primitive_cube_add(size=0.18, location=(x + 0.65, 0, 1.9))
        pauld_r = apply_mesh(bpy.context.active_object, col, m_pri)

    elif role == "Assassin":
        # Low profile segmented stealth cowls
        for sx in [-0.62, 0.62]:
            bpy.ops.mesh.primitive_cube_add(size=0.25, location=(x + sx, 0, 1.9))
            p = apply_mesh(bpy.context.active_object, col, m_dark)
            p.scale = (1.1, 0.7, 0.6)

    else: # Tank
        # Massive fortress ramparts
        for sx in [-0.75, 0.75]:
            bpy.ops.mesh.primitive_cube_add(size=0.52, location=(x + sx, 0, 1.98))
            p = apply_mesh(bpy.context.active_object, col, m_pri)
            p.scale = (1.0, 1.1, 0.9)
            # Granite crenelation
            bpy.ops.mesh.primitive_cube_add(size=0.18, location=(x + sx * 1.08, 0, 2.25))
            crenel = apply_mesh(bpy.context.active_object, col, m_acc)

    # 8. Natural Archetype Headgear & Face
    if role == "Fighter":
        # Knight Greathelm with tapered cheekplates & glowing visor
        bpy.ops.mesh.primitive_cube_add(size=0.42, location=(x, 0.02, 2.32))
        helm = apply_mesh(bpy.context.active_object, col, m_pri)
        helm.scale = (0.95, 1.05, 1.1)

        # Cheek guards
        bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=0.16, depth=0.35, location=(x, 0.12, 2.2))
        cheeks = apply_mesh(bpy.context.active_object, col, m_sec)

        # Angular crest
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.07, depth=0.55, location=(x, -0.06, 2.62))
        crest = apply_mesh(bpy.context.active_object, col, m_acc)
        crest.rotation_euler = (math.radians(28), 0, 0)

        # Visor slit
        bpy.ops.mesh.primitive_cube_add(size=0.08, location=(x, 0.24, 2.34))
        visor = apply_mesh(bpy.context.active_object, col, m_acc)
        visor.scale = (3.4, 0.4, 0.5)

    elif role == "Mage":
        # Layered flowing cosmic hood draped naturally over neck
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.38, depth=0.68, location=(x, -0.04, 2.32))
        cowl = apply_mesh(bpy.context.active_object, col, m_sec)

        # Mysterious shadowed inner face
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.18, location=(x, 0.1, 2.28))
        inner_face = apply_mesh(bpy.context.active_object, col, m_dark)

        # Floating crown/tiara crystal
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.14, location=(x, 0.22, 2.52))
        tiara = apply_mesh(bpy.context.active_object, col, m_acc)

        # Lower Robe drape (replaces bare legs with majestic cloth silhouette)
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=0.68, radius2=0.35, depth=0.95, location=(x, 0, 0.72))
        robe = apply_mesh(bpy.context.active_object, col, m_cloth)
        robe.scale = (1.05, 0.9, 1.0)

    elif role == "Marksman":
        # Scout hood with cowl drape & feather
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.32, depth=0.45, location=(x, 0, 2.3))
        hood = apply_mesh(bpy.context.active_object, col, m_pri)

        # Eagle feather
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.06, depth=0.48, location=(x - 0.28, -0.05, 2.52))
        feather = apply_mesh(bpy.context.active_object, col, m_acc)
        feather.rotation_euler = (math.radians(-10), math.radians(-15), math.radians(35))

        # Split wind cape falling behind
        bpy.ops.mesh.primitive_cube_add(size=0.4, location=(x, -0.25, 1.45))
        cape = apply_mesh(bpy.context.active_object, col, m_cloth)
        cape.scale = (1.1, 0.1, 2.2)
        cape.rotation_euler = (math.radians(12), 0, 0)

        # Diagonal quiver across back
        bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.11, depth=0.7, location=(x + 0.2, -0.24, 1.7))
        quiver = apply_mesh(bpy.context.active_object, col, m_sec)
        quiver.rotation_euler = (math.radians(18), math.radians(22), 0)

        # Arrow fletchings sticking out
        for a_off in [-0.04, 0.04]:
            bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.03, depth=0.2, location=(x + 0.28 + a_off, -0.32, 2.1))
            fletch = apply_mesh(bpy.context.active_object, col, m_acc)

    elif role == "Assassin":
        # Ninja cowl & dark wrap
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.26, location=(x, 0.02, 2.28))
        mask = apply_mesh(bpy.context.active_object, col, m_dark)

        # Neck wrap scarf trailing behind
        bpy.ops.mesh.primitive_torus_add(major_radius=0.25, minor_radius=0.08, major_segments=6, minor_segments=4, location=(x, 0, 2.06))
        scarf = apply_mesh(bpy.context.active_object, col, m_sec)

        # Scarf tail trailing in the wind
        bpy.ops.mesh.primitive_cube_add(size=0.22, location=(x + 0.22, -0.28, 1.9))
        scarf_tail = apply_mesh(bpy.context.active_object, col, m_sec)
        scarf_tail.scale = (0.5, 0.15, 1.8)
        scarf_tail.rotation_euler = (math.radians(28), 0, math.radians(-25))

        # Twin slit neon crimson optics
        for ex in [-0.08, 0.08]:
            bpy.ops.mesh.primitive_cube_add(size=0.04, location=(x + ex, 0.25, 2.3))
            optic = apply_mesh(bpy.context.active_object, col, m_acc)
            optic.scale = (1.6, 0.3, 0.5)

    else: # Tank
        # Massive monolithic basalt head integrated directly into rocky trapezius
        bpy.ops.mesh.primitive_cube_add(size=0.54, location=(x, 0.04, 2.26))
        head = apply_mesh(bpy.context.active_object, col, m_pri)
        head.scale = (0.95, 1.0, 0.9)

        # Stone brow plate
        bpy.ops.mesh.primitive_cube_add(size=0.18, location=(x, 0.28, 2.38))
        brow = apply_mesh(bpy.context.active_object, col, m_sec)
        brow.scale = (3.2, 0.8, 0.7)

        # Inset glowing rune eye band
        bpy.ops.mesh.primitive_cube_add(size=0.08, location=(x, 0.29, 2.24))
        eyes = apply_mesh(bpy.context.active_object, col, m_acc)
        eyes.scale = (4.2, 0.4, 0.5)

        # Back crag boulders (hunchback bedrock silhouette)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.45, location=(x, -0.32, 1.95))
        back_crag = apply_mesh(bpy.context.active_object, col, m_pri)
        back_crag.scale = (1.2, 0.8, 1.1)

    # 9. Natural Weapon Construction & Hand Attachment
    if role == "Fighter":
        # Two-handed Claymore planted into the pedestal in front of hero
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.035, depth=0.7, location=(x + 0.15, 0.55, 1.45))
        grip = apply_mesh(bpy.context.active_object, col, m_dark)

        bpy.ops.mesh.primitive_cube_add(size=0.12, location=(x + 0.15, 0.55, 1.25))
        crossguard = apply_mesh(bpy.context.active_object, col, m_sec)
        crossguard.scale = (3.6, 0.7, 0.7)

        # Blade with tapered edge
        bpy.ops.mesh.primitive_cube_add(size=0.25, location=(x + 0.15, 0.55, 0.65))
        blade = apply_mesh(bpy.context.active_object, col, m_pri)
        blade.scale = (0.8, 0.2, 4.2)

        # Molten ember fuller line
        bpy.ops.mesh.primitive_cube_add(size=0.06, location=(x + 0.15, 0.55, 0.65))
        fuller = apply_mesh(bpy.context.active_object, col, m_acc)
        fuller.scale = (0.4, 0.3, 3.8)

    elif role == "Mage":
        # Astrolabe Catalyst Staff held in right hand
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.03, depth=2.0, location=(x + 0.65, 0.2, 1.4))
        staff_wood = apply_mesh(bpy.context.active_object, col, m_dark)

        # Gyroscope metal ring
        bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.025, major_segments=8, minor_segments=4, location=(x + 0.65, 0.2, 2.38))
        gyro = apply_mesh(bpy.context.active_object, col, m_sec)
        gyro.rotation_euler = (math.radians(35), math.radians(20), 0)

        # Floating core catalyst sphere
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.16, location=(x + 0.65, 0.2, 2.38))
        catalyst = apply_mesh(bpy.context.active_object, col, m_acc)

    elif role == "Marksman":
        # Recurve Composite Bow held in left hand ready for draw
        bpy.ops.mesh.primitive_torus_add(major_radius=0.68, minor_radius=0.032, major_segments=10, minor_segments=4, location=(x - 0.65, 0.3, 1.4))
        bow = apply_mesh(bpy.context.active_object, col, m_pri)
        bow.rotation_euler = (math.radians(15), math.radians(85), 0)

        # Bow grip wrap
        bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.05, depth=0.22, location=(x - 0.65, 0.3, 1.4))
        grip = apply_mesh(bpy.context.active_object, col, m_sec)

        # Bowstring
        bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=0.008, depth=1.32, location=(x - 0.58, 0.3, 1.4))
        string = apply_mesh(bpy.context.active_object, col, m_acc)

    elif role == "Assassin":
        # Twin Trench Daggers held in reverse-grip along forearms
        for i, dx in enumerate([-0.65, 0.65]):
            side = "L" if i == 0 else "R"
            # Hilt in hand
            bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.03, depth=0.25, location=(x + dx, 0.15, 1.05))
            hilt = apply_mesh(bpy.context.active_object, col, m_dark)

            # Curved reverse blade extending back along forearm
            bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.08, depth=0.7, location=(x + dx, 0.12, 1.35))
            dblade = apply_mesh(bpy.context.active_object, col, m_acc)
            dblade.rotation_euler = (math.radians(-160), 0, 0)

    else: # Tank
        # Massive Fortress Tower Shield held on left arm
        bpy.ops.mesh.primitive_cube_add(size=0.15, location=(x - 0.82, 0.45, 1.15))
        shield = apply_mesh(bpy.context.active_object, col, m_sec)
        shield.scale = (5.8, 1.2, 9.5)
        shield.rotation_euler = (0, math.radians(12), 0)

        # Runic shield crest & boss
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.24, location=(x - 0.82, 0.56, 1.35))
        boss = apply_mesh(bpy.context.active_object, col, m_acc)

        # Granite Warhammer rested on right shoulder
        bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.05, depth=1.3, location=(x + 0.72, 0.1, 1.7))
        shaft = apply_mesh(bpy.context.active_object, col, m_dark)
        shaft.rotation_euler = (math.radians(-35), math.radians(20), 0)

        bpy.ops.mesh.primitive_cube_add(size=0.38, location=(x + 0.85, -0.22, 2.15))
        hammer = apply_mesh(bpy.context.active_object, col, m_pri)
        hammer.scale = (1.1, 1.6, 0.9)
        hammer.rotation_euler = (math.radians(-35), math.radians(20), 0)

def build_scene():
    clean_scene()

    main_col = bpy.data.collections.get("Atheria_MOBA")
    if not main_col:
        main_col = bpy.data.collections.new("Atheria_MOBA")
        bpy.context.scene.collection.children.link(main_col)

    hero_specs = [
        {
            "id": "vanguard",
            "name": "Ignis_Valen",
            "role": "Fighter",
            "x": -6.0,
            "c_pri": "#8F2526",
            "c_sec": "#27293D",
            "c_acc": "#E86A17",
            "c_cloth": "#5E1819"
        },
        {
            "id": "arcanist",
            "name": "Vespera",
            "role": "Mage",
            "x": -3.0,
            "c_pri": "#4E2661",
            "c_sec": "#160A29",
            "c_acc": "#9F75E8",
            "c_cloth": "#2A133D"
        },
        {
            "id": "ranger",
            "name": "Zephyr",
            "role": "Marksman",
            "x": 0.0,
            "c_pri": "#238276",
            "c_sec": "#1F3842",
            "c_acc": "#8BE0BD",
            "c_cloth": "#16282E"
        },
        {
            "id": "wraith",
            "name": "Umbra",
            "role": "Assassin",
            "x": 3.0,
            "c_pri": "#1C1C20",
            "c_sec": "#3D0C13",
            "c_acc": "#E6004C",
            "c_cloth": "#121215"
        },
        {
            "id": "colossus",
            "name": "Balthazar",
            "role": "Tank",
            "x": 6.0,
            "c_pri": "#4F483D",
            "c_sec": "#262C22",
            "c_acc": "#D4B35D",
            "c_cloth": "#1B1713"
        }
    ]

    for hero in hero_specs:
        build_natural_hero(hero, main_col)

    # Studio Lighting & Camera
    light_col = bpy.data.collections.new("Studio_Environment")
    main_col.children.link(light_col)

    bpy.ops.object.light_add(type='SUN', location=(12, -12, 16))
    sun = apply_mesh(bpy.context.active_object, light_col)
    sun.name = "Key_SunLight"
    sun.data.energy = 3.2
    sun.data.color = (1.0, 0.98, 0.94)

    bpy.ops.object.light_add(type='AREA', location=(0, -9, 6))
    area_light = apply_mesh(bpy.context.active_object, light_col)
    area_light.name = "Fill_AreaLight"
    area_light.data.energy = 380.0
    area_light.data.size = 16.0

    bpy.ops.object.light_add(type='SUN', location=(-12, 10, 8))
    rim = apply_mesh(bpy.context.active_object, light_col)
    rim.name = "Rim_BackLight"
    rim.data.energy = 1.2
    rim.data.color = (0.75, 0.85, 1.0)

    bpy.ops.object.camera_add(location=(0, -13.0, 4.2))
    cam = apply_mesh(bpy.context.active_object, light_col)
    cam.name = "Showcase_Camera"
    cam.rotation_euler = (math.radians(76), 0, 0)
    bpy.context.scene.camera = cam

    # Save to disk
    save_dir = r"C:\Users\acer_\Documents\Aaether Raft_Modelling3d"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, "moba_heroes_lineup.blend")
    bpy.ops.wm.save_as_mainfile(filepath=save_path)
    print("SUCCESS: 5 Natural MOBA Heroes created and saved to", save_path)

if __name__ == "__main__":
    build_scene()
