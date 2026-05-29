<?php
namespace App\Controller\Admin;

use App\Entity\Tenant\Eshop;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/eshops', name: 'admin_eshops_')]
#[IsGranted('ROLE_ADMIN')]
class EshopController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/', name: 'index')]
    public function index(): Response
    {
        $eshops = $this->em->getRepository(Eshop::class)->findBy([], ['createdAt' => 'DESC']);
        return $this->render('admin/eshops/index.html.twig', ['eshops' => $eshops]);
    }

    #[Route('/new', name: 'new', methods: ['POST'])]
    public function new(Request $request): Response
    {
        if (!$this->isCsrfTokenValid('eshop_new', $request->get('_csrf_token'))) {
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirect('/admin/eshops/');
        }

        $name   = trim($request->get('name', ''));
        $domain = trim($request->get('domain', ''));

        if (!$name || !$domain) {
            $this->addFlash('error', 'Název a doména jsou povinné.');
            return $this->redirect('/admin/eshops/');
        }

        $existing = $this->em->getRepository(Eshop::class)->findOneBy(['domain' => $domain]);
        if ($existing) {
            $this->addFlash('error', 'E-shop s touto doménou již existuje.');
            return $this->redirect('/admin/eshops/');
        }

        $eshop = new Eshop();
        $eshop->setName($name);
        $eshop->setDomain($domain);

        $this->em->persist($eshop);
        $this->em->flush();

        $this->addFlash('success', "E-shop \"$name\" byl přidán.");
        return $this->redirect('/admin/eshops/');
    }

    #[Route('/{id}/delete', name: 'delete', methods: ['POST'])]
    public function delete(int $id, Request $request): Response
    {
        if (!$this->isCsrfTokenValid('eshop_delete_' . $id, $request->get('_csrf_token'))) {
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirect('/admin/eshops/');
        }

        $eshop = $this->em->getRepository(Eshop::class)->find($id);
        if (!$eshop) {
            $this->addFlash('error', 'E-shop nenalezen.');
            return $this->redirect('/admin/eshops/');
        }

        // Ověř že admin přepsal název správně
        $confirmed = trim($request->get('confirm_name', ''));
        if ($confirmed !== $eshop->getName()) {
            $this->addFlash('error', 'Zadaný název neodpovídá. Smazání zrušeno.');
            return $this->redirect('/admin/eshops/');
        }

        $name = $eshop->getName();
        $this->em->remove($eshop);
        $this->em->flush();

        $this->addFlash('success', "E-shop \"$name\" byl smazán.");
        return $this->redirect('/admin/eshops/');
    }
}
