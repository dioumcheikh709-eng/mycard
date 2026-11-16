#include "PluginEditor.h"
using namespace juce::gl;

// ---------------------------------------------------------------------------------------------
// Shaders (syntaxe GLSL "legacy" ; JUCE la convertit en 3.2 core via translate*ToV3)
// ---------------------------------------------------------------------------------------------
static const char* vertexSrc = R"(
attribute vec2 pos;
varying vec2 uv;
void main() { uv = pos * 0.5 + 0.5; gl_Position = vec4 (pos, 0.0, 1.0); }
)";

static const char* fragmentSrc = R"(
varying vec2 uv;
uniform vec2  res;
uniform float time;
uniform float spec[64];
uniform float bass, mid, high, level, stars;
uniform int   palette;

float hash (vec2 p) { p = fract (p * vec2 (123.34, 456.21)); p += dot (p, p + 45.32); return fract (p.x * p.y); }

float noise (vec2 p)
{
    vec2 i = floor (p), f = fract (p);
    f = f * f * (3.0 - 2.0 * f);
    return mix (mix (hash (i), hash (i + vec2 (1, 0)), f.x),
                mix (hash (i + vec2 (0, 1)), hash (i + vec2 (1, 1)), f.x), f.y);
}

float fbm (vec2 p)
{
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; ++i) { v += a * noise (p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
}

float getSpec (float x)
{
    float f = clamp (x, 0.0, 1.0) * 63.0;
    int i = int (floor (f));
    float t = fract (f);
    return mix (spec[i], spec[min (i + 1, 63)], t);
}

// Dégradé de l'aurore : bas (intense) -> haut (diffus)
vec3 auroraColor (float t, float hueShift)
{
    vec3 lo, mi, hi;
    if (palette == 0)      { lo = vec3 (0.10, 1.00, 0.45); mi = vec3 (0.05, 0.85, 0.75); hi = vec3 (0.55, 0.25, 0.95); }
    else if (palette == 1) { lo = vec3 (0.55, 0.30, 1.00); mi = vec3 (0.85, 0.25, 0.95); hi = vec3 (0.20, 0.50, 1.00); }
    else if (palette == 2) { lo = vec3 (1.00, 0.30, 0.55); mi = vec3 (0.95, 0.35, 0.85); hi = vec3 (0.40, 0.30, 1.00); }
    else                   { lo = vec3 (0.40, 0.95, 1.00); mi = vec3 (0.30, 0.65, 1.00); hi = vec3 (0.75, 0.55, 1.00); }
    vec3 c = mix (lo, mi, smoothstep (0.0, 0.5, t));
    c = mix (c, hi, smoothstep (0.45, 1.0, t));
    return mix (c, c.gbr, hueShift);
}

// Le ciel complet pour une coordonnée donnée (utilisé aussi pour le reflet)
vec3 sky (vec2 p, float horizon)
{
    float y = (p.y - horizon) / (1.0 - horizon);       // 0 à l'horizon, 1 en haut
    float aspect = res.x / res.y;

    // fond de ciel : nuit profonde, légèrement éclairée par l'énergie globale
    vec3 col = mix (vec3 (0.015, 0.025, 0.06), vec3 (0.0, 0.0, 0.02), y);
    col += vec3 (0.0, 0.03, 0.03) * level * (1.0 - y);

    // étoiles (scintillent avec les aigus)
    vec2 sp = vec2 (p.x * aspect, p.y) * 180.0;
    vec2 id = floor (sp);
    float h = hash (id);
    float star = step (0.985, h) * smoothstep (0.5, 0.0, length (fract (sp) - 0.5));
    star *= 0.5 + 0.5 * sin (time * (2.0 + h * 5.0) + h * 40.0) + high * 1.5;
    col += vec3 (0.85, 0.9, 1.0) * star * stars * smoothstep (0.0, 0.3, y);

    // rideaux d'aurore : 4 couches, la hauteur suit le spectre à la position x
    for (int l = 0; l < 4; ++l)
    {
        float fl = float (l);
        float x = p.x;
        float sx = getSpec (x * 0.9 + 0.05 * sin (fl * 2.0));        // énergie locale
        float e = clamp (sx * (0.7 + 0.5 * fl * 0.3) + bass * 0.25, 0.0, 1.5);

        float wave = fbm (vec2 (x * 2.2 + fl * 5.3, time * 0.12 + fl * 3.0));
        float wave2 = fbm (vec2 (x * 6.0 - fl * 2.1, time * 0.25));
        float base  = 0.18 + 0.10 * fl + 0.22 * (wave - 0.5) + 0.04 * (wave2 - 0.5);
        float d = y - base;
        float height = 0.10 + 0.30 * e + 0.06 * mid;

        // bord inférieur net, haut qui s'estompe
        float body = smoothstep (-0.01, 0.03, d) * exp (-max (d, 0.0) / height);
        // rayons verticaux : étirés en y, animés
        float rays = fbm (vec2 (x * 70.0 + fl * 9.0 + wave * 6.0, time * 0.4 + d * 1.2));
        rays = 0.45 + 1.1 * rays;
        float shimmer = 0.75 + 0.25 * sin (time * 1.3 + x * 20.0 + fl);

        float inten = body * rays * shimmer * (0.25 + 1.1 * e) * (1.0 - 0.18 * fl);
        col += auroraColor (clamp (d / (height * 3.0), 0.0, 1.0), 0.04 * fl) * inten * 0.9;
    }
    return col;
}

void main()
{
    float horizon = 0.20;
    vec2 p = uv;
    vec3 col;

    if (p.y >= horizon)
    {
        col = sky (p, horizon);
        // montagnes en silhouette
        float m = horizon + 0.035 + 0.07 * fbm (vec2 (p.x * 3.5 + 4.0, 1.0))
                          + 0.03 * fbm (vec2 (p.x * 12.0, 7.0));
        col = mix (col, vec3 (0.004, 0.006, 0.012), smoothstep (m + 0.002, m - 0.002, p.y));
    }
    else
    {
        // lac : reflet du ciel, ondulé par les basses
        float depth = (horizon - p.y) / horizon;
        vec2 q = vec2 (p.x + (fbm (vec2 (p.x * 8.0, p.y * 60.0 + time * 0.5)) - 0.5) * (0.012 + 0.02 * bass) * (0.3 + depth),
                       2.0 * horizon - p.y);
        col = sky (q, horizon) * mix (0.7, 0.25, depth);
        // rivage sombre
        float m = horizon + 0.035 + 0.07 * fbm (vec2 (q.x * 3.5 + 4.0, 1.0)) + 0.03 * fbm (vec2 (q.x * 12.0, 7.0));
        col = mix (col, vec3 (0.004, 0.006, 0.012), smoothstep (m + 0.002, m - 0.002, q.y) * 0.9);
    }

    // vignettage + tone mapping doux
    vec2 c = uv - 0.5;
    col *= 1.0 - 0.6 * dot (c, c);
    col = 1.0 - exp (-col * 1.6);
    col = pow (col, vec3 (0.9));
    gl_FragColor = vec4 (col, 1.0);
}
)";

// ---------------------------------------------------------------------------------------------
AuroraEditor::AuroraEditor (AuroraProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    setOpaque (true);
    setResizable (true, true);
    setResizeLimits (480, 270, 3840, 2160);
    getConstrainer()->setFixedAspectRatio (16.0 / 9.0);
    setSize (960, 540);

    setupSlider (sens,   sensL,   "Sensibilite");
    setupSlider (smooth, smoothL, "Fluidite");
    setupSlider (speed,  speedL,  "Vitesse");
    setupSlider (stars,  starsL,  "Etoiles");
    sensA   = std::make_unique<SA> (processor.apvts, "sensitivity", sens);
    smoothA = std::make_unique<SA> (processor.apvts, "smoothing", smooth);
    speedA  = std::make_unique<SA> (processor.apvts, "speed", speed);
    starsA  = std::make_unique<SA> (processor.apvts, "stars", stars);

    palette.addItemList ({ "Boreale verte", "Violet", "Rose polaire", "Glace" }, 1);
    addChildComponent (palette);
    paletteA = std::make_unique<CA> (processor.apvts, "palette", palette);

    startTime = lastTime = juce::Time::getMillisecondCounterHiRes() * 0.001;
    glContext.setOpenGLVersionRequired (juce::OpenGLContext::openGL3_2);
    glContext.setRenderer (this);
    glContext.setComponentPaintingEnabled (true);   // les contrôles JUCE restent dessinés par-dessus
    glContext.setContinuousRepainting (true);
    glContext.setSwapInterval (1);
    glContext.attachTo (*this);
}

AuroraEditor::~AuroraEditor()
{
    glContext.detach();
}

void AuroraEditor::setupSlider (juce::Slider& s, juce::Label& l, const juce::String& text)
{
    s.setSliderStyle (juce::Slider::RotaryHorizontalVerticalDrag);
    s.setTextBoxStyle (juce::Slider::NoTextBox, false, 0, 0);
    l.setText (text, juce::dontSendNotification);
    l.setJustificationType (juce::Justification::centred);
    l.setColour (juce::Label::textColourId, juce::Colours::white.withAlpha (0.8f));
    l.setInterceptsMouseClicks (false, false);
    addChildComponent (s);
    addChildComponent (l);
}

void AuroraEditor::resized()
{
    const int barH = juce::jmin (90, getHeight() / 5);
    auto bar = getLocalBounds().removeFromBottom (barH).reduced (12, 6);
    const int w = bar.getWidth() / 5;
    auto place = [&] (juce::Slider& s, juce::Label& l)
    {
        auto cell = bar.removeFromLeft (w);
        l.setBounds (cell.removeFromBottom (18));
        s.setBounds (cell);
    };
    place (sens, sensL); place (smooth, smoothL); place (speed, speedL); place (stars, starsL);
    palette.setBounds (bar.withSizeKeepingCentre (juce::jmin (bar.getWidth(), 160), 28));
}

void AuroraEditor::mouseDoubleClick (const juce::MouseEvent&)
{
    const bool show = ! sens.isVisible();
    for (auto* c : std::initializer_list<juce::Component*> { &sens, &smooth, &speed, &stars, &sensL, &smoothL,
                                                              &speedL, &starsL, &palette })
        c->setVisible (show);
}

// ---------------------------------------------------------------------------------------------
// GL
// ---------------------------------------------------------------------------------------------
void AuroraEditor::newOpenGLContextCreated()
{
    const float quad[] = { -1, -1, 1, -1, -1, 1, 1, 1 };
    glGenVertexArrays (1, &vao);
    glBindVertexArray (vao);
    glGenBuffers (1, &vbo);
    glBindBuffer (GL_ARRAY_BUFFER, vbo);
    glBufferData (GL_ARRAY_BUFFER, sizeof (quad), quad, GL_STATIC_DRAW);
    buildShader();
}

void AuroraEditor::buildShader()
{
    auto prog = std::make_unique<juce::OpenGLShaderProgram> (glContext);
    if (prog->addVertexShader (juce::OpenGLHelpers::translateVertexShaderToV3 (vertexSrc))
        && prog->addFragmentShader (juce::OpenGLHelpers::translateFragmentShaderToV3 (fragmentSrc))
        && prog->link())
    {
        auto u = [&] (const char* n) { return std::make_unique<juce::OpenGLShaderProgram::Uniform> (*prog, n); };
        uRes = u ("res"); uTime = u ("time"); uSpec = u ("spec"); uBass = u ("bass"); uMid = u ("mid");
        uHigh = u ("high"); uLevel = u ("level"); uPalette = u ("palette"); uStars = u ("stars");
        shader = std::move (prog);
    }
    else
    {
        DBG ("Aurora shader error: " << prog->getLastError());
        shader.reset();
    }
}

void AuroraEditor::openGLContextClosing()
{
    shader.reset();
    uRes.reset(); uTime.reset(); uSpec.reset(); uBass.reset(); uMid.reset();
    uHigh.reset(); uLevel.reset(); uPalette.reset(); uStars.reset();
    glDeleteBuffers (1, &vbo);
    glDeleteVertexArrays (1, &vao);
    vbo = vao = 0;
}

void AuroraEditor::analyse()
{
    const auto& ap = processor.apvts;
    const float sensitivity = ap.getRawParameterValue ("sensitivity")->load();
    const float smoothing   = ap.getRawParameterValue ("smoothing")->load();

    // Récupère tout ce qui est arrivé depuis la dernière image et le pousse dans le tampon circulaire
    int got;
    while ((got = processor.pullSamples (scratch.data(), (int) scratch.size())) > 0)
    {
        if (got >= fftSize)
            std::copy_n (scratch.begin() + (got - fftSize), fftSize, ring.begin());
        else
        {
            std::move (ring.begin() + got, ring.end(), ring.begin());
            std::copy_n (scratch.begin(), got, ring.end() - got);
        }
    }

    std::copy (ring.begin(), ring.end(), fftBuf.begin());
    std::fill (fftBuf.begin() + fftSize, fftBuf.end(), 0.0f);
    window.multiplyWithWindowingTable (fftBuf.data(), (size_t) fftSize);
    fft.performFrequencyOnlyForwardTransform (fftBuf.data());

    // Bandes logarithmiques 30 Hz .. 16 kHz
    const double sr = processor.getCurrentSampleRate();
    const double binHz = sr / fftSize;
    const double fMin = 30.0, fMax = juce::jmin (16000.0, sr * 0.45);
    const float releaseCoef = 0.80f + 0.19f * smoothing;     // plus la fluidité est haute, plus la chute est lente
    const float attackCoef  = 0.25f * smoothing;

    for (int b = 0; b < numBands; ++b)
    {
        const double f0 = fMin * std::pow (fMax / fMin, (double) b / numBands);
        const double f1 = fMin * std::pow (fMax / fMin, (double) (b + 1) / numBands);
        const int k0 = juce::jlimit (1, fftSize / 2 - 1, (int) std::floor (f0 / binHz));
        const int k1 = juce::jlimit (k0 + 1, fftSize / 2, (int) std::ceil (f1 / binHz));
        float m = 0.0f;
        for (int k = k0; k < k1; ++k) m = juce::jmax (m, fftBuf[(size_t) k]);

        // magnitude -> dB -> 0..1  (-70 dB .. -5 dB), + léger tilt pour compenser la pente des aigus
        const float norm = m / (float) (fftSize * 0.25f);
        const float db = juce::Decibels::gainToDecibels (norm * sensitivity, -100.0f)
                         + 4.0f * (float) b / numBands * 3.0f;
        const float target = juce::jlimit (0.0f, 1.0f, (db + 70.0f) / 65.0f);
        float& cur = bands[(size_t) b];
        cur = target > cur ? cur + (target - cur) * (1.0f - attackCoef)
                           : cur * releaseCoef + target * (1.0f - releaseCoef);
    }

    auto avg = [&] (int a, int b)
    {
        float s = 0; for (int i = a; i < b; ++i) s += bands[(size_t) i]; return s / (float) (b - a);
    };
    bass = avg (0, 12); mid = avg (12, 40); high = avg (40, numBands);
    level = (bass + mid + high) / 3.0f;
}

void AuroraEditor::renderOpenGL()
{
    jassert (juce::OpenGLHelpers::isContextActive());
    const double now = juce::Time::getMillisecondCounterHiRes() * 0.001;
    const float dt = (float) juce::jlimit (0.0, 0.1, now - lastTime);
    lastTime = now;
    animTime += dt * processor.apvts.getRawParameterValue ("speed")->load();

    analyse();

    const float scale = (float) glContext.getRenderingScale();
    const int w = juce::roundToInt (scale * (float) getWidth());
    const int h = juce::roundToInt (scale * (float) getHeight());
    glViewport (0, 0, w, h);
    glDisable (GL_DEPTH_TEST);
    glDisable (GL_BLEND);
    juce::OpenGLHelpers::clear (juce::Colours::black);

    if (shader == nullptr) return;
    shader->use();

    uRes->set ((GLfloat) w, (GLfloat) h);
    uTime->set (animTime);
    uSpec->set (bands.data(), numBands);
    uBass->set (bass); uMid->set (mid); uHigh->set (high); uLevel->set (level);
    uStars->set (processor.apvts.getRawParameterValue ("stars")->load());
    uPalette->set ((GLint) processor.apvts.getRawParameterValue ("palette")->load());

    glBindVertexArray (vao);
    glBindBuffer (GL_ARRAY_BUFFER, vbo);
    const GLint loc = glGetAttribLocation (shader->getProgramID(), "pos");
    glEnableVertexAttribArray ((GLuint) loc);
    glVertexAttribPointer ((GLuint) loc, 2, GL_FLOAT, GL_FALSE, 0, nullptr);
    glDrawArrays (GL_TRIANGLE_STRIP, 0, 4);
    glDisableVertexAttribArray ((GLuint) loc);
}
