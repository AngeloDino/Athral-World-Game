// ─── constants/globalStyles.js ────────────────────────────────────────────────
// Estilos globales reutilizables — equivalente al index.css de la app

import { StyleSheet } from "react-native";
import { colors as C, spacing as S, typography as T, radius as R } from "./theme";

const g = StyleSheet.create({

  // ─── Layout base ────────────────────────────────────────────────────────────
  screen:        { flex:1, backgroundColor:C.bg },
  scroll:        { paddingHorizontal:S.lg, paddingTop:S.sm },
  centered:      { flex:1, justifyContent:"center", alignItems:"center" },
  row:           { flexDirection:"row", alignItems:"center" },
  rowBetween:    { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  col:           { flexDirection:"column" },

  // ─── Header con botón atrás ──────────────────────────────────────────────────
  // Estructura: <View style={g.headerWrap}> <TouchableOpacity style={g.backBtn}> ... </TouchableOpacity> </View>
  //             <Text style={g.headerTitle}>TÍTULO</Text>
  headerWrap:    {
    paddingTop:       52,
    paddingHorizontal:S.lg,
    paddingBottom:    S.xs,
  },
  backBtn:       {
    alignSelf:        "flex-start",
    paddingVertical:  S.sm,
    paddingHorizontal:S.md,
    borderWidth:      1,
    borderColor:      "#e8e0f033",
    borderRadius:     R.md,
    backgroundColor:  "#e8e0f011",
  },
  backBtnText:   {
    color:            C.text,
    fontSize:         T.lg,
    fontWeight:       T.bold,
  },
  headerTitle:   {
    color:            C.accent,
    fontSize:         T.lg,
    fontWeight:       T.black,
    letterSpacing:    T.wider,
    textAlign:        "center",
    paddingHorizontal:S.lg,
    paddingTop:       S.xs,
    paddingBottom:    S.sm,
  },
  headerTitleLeft:{
    color:            C.accent,
    fontSize:         T.lg,
    fontWeight:       T.black,
    letterSpacing:    T.wider,
    paddingHorizontal:S.lg,
    paddingVertical:  S.sm,
  },

  // ─── Section label ───────────────────────────────────────────────────────────
  sectionLabel:  {
    color:         C.textDim,
    fontSize:      T.xs,
    fontWeight:    T.black,
    letterSpacing: T.wide,
    marginBottom:  S.sm,
    marginTop:     S.sm,
  },

  // ─── Cards ───────────────────────────────────────────────────────────────────
  card:          {
    backgroundColor: C.surface,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    R.lg,
    overflow:        "hidden",
    marginBottom:    S.lg,
  },
  cardBody:      {
    padding: S.lg,
    gap:     S.md,
  },
  cardTitle:     {
    color:       C.text,
    fontSize:    T.lg,
    fontWeight:  T.black,
    letterSpacing: T.tight,
  },
  cardSubtitle:  {
    color:      C.textDim,
    fontSize:   T.sm,
    lineHeight: 17,
    marginTop:  S.xs,
  },

  // ─── Botones ─────────────────────────────────────────────────────────────────
  btnPrimary:    {
    backgroundColor: C.accent,
    borderRadius:    R.md,
    paddingVertical: S.md,
    alignItems:      "center",
  },
  btnPrimaryText:{
    color:        C.bg,
    fontSize:     T.md,
    fontWeight:   T.black,
    letterSpacing:T.normal,
  },
  btnOutline:    {
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    R.md,
    paddingVertical: S.md,
    alignItems:      "center",
  },
  btnOutlineText:{
    color:        C.textDim,
    fontSize:     T.md,
    fontWeight:   T.bold,
    letterSpacing:T.normal,
  },
  btnDanger:     {
    borderWidth:     1,
    borderColor:     C.danger + "88",
    backgroundColor: C.danger + "15",
    borderRadius:    R.md,
    paddingVertical: S.md,
    alignItems:      "center",
  },
  btnDangerText: {
    color:        C.danger,
    fontSize:     T.md,
    fontWeight:   T.black,
    letterSpacing:T.normal,
  },
  btnBoss:       {
    borderWidth:     1,
    borderColor:     C.boss,
    backgroundColor: C.boss + "22",
    borderRadius:    R.md,
    paddingVertical: S.lg,
    alignItems:      "center",
  },
  btnBossText:   {
    color:        C.boss,
    fontSize:     T.md,
    fontWeight:   T.black,
    letterSpacing:T.wide,
  },
  btnDisabled:   { opacity:0.3 },

  // ─── Badges / Pills ──────────────────────────────────────────────────────────
  badge:         {
    borderWidth:      1,
    borderRadius:     R.sm,
    paddingHorizontal:S.sm,
    paddingVertical:  S.xs,
  },
  badgeText:     {
    fontSize:     T.xs,
    fontWeight:   T.black,
    letterSpacing:T.tight,
  },
  pill:          {
    borderWidth:      1,
    borderRadius:     R.sm,
    paddingHorizontal:S.sm,
    paddingVertical:  S.xs,
  },
  pillText:      {
    fontSize:   T.xs,
    fontWeight: T.bold,
  },

  // ─── Stats row (3 columnas) ───────────────────────────────────────────────────
  statsRow:      {
    flexDirection: "row",
    backgroundColor: C.surface2,
    borderRadius:  R.sm,
    overflow:      "hidden",
  },
  statItem:      {
    flex:          1,
    paddingVertical:S.sm,
    alignItems:    "center",
    gap:           3,
  },
  statDivider:   { width:1, backgroundColor:C.border },
  statLabel:     {
    color:        C.textDim,
    fontSize:     T.xs,
    fontWeight:   T.black,
    letterSpacing:T.tight,
  },
  statValue:     {
    color:      C.text,
    fontSize:   T.md,
    fontWeight: T.black,
  },

  // ─── Input ────────────────────────────────────────────────────────────────────
  input:         {
    backgroundColor: C.surface,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    R.md,
    padding:         S.md,
    color:           C.text,
    fontSize:        T.md,
  },

  // ─── Divider ─────────────────────────────────────────────────────────────────
  divider:       { height:1, backgroundColor:C.border },

  // ─── Loading overlay ─────────────────────────────────────────────────────────
  loadingOverlay:{
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000aa",
    justifyContent:  "center",
    alignItems:      "center",
  },

  // ─── Empty / Coming soon ──────────────────────────────────────────────────────
  comingSoonBox: {
    backgroundColor: C.surface,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    R.lg,
    padding:         S.xl,
    alignItems:      "center",
    gap:             S.sm,
    marginTop:       S.lg,
  },
  comingSoonTitle:{
    color:        C.textDim,
    fontSize:     T.sm,
    fontWeight:   T.black,
    letterSpacing:T.wide,
  },
  comingSoonSub: {
    color:      C.textDim,
    fontSize:   T.sm,
    fontStyle:  "italic",
  },
});

export default g;